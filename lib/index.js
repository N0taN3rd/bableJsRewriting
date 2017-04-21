const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const Path = require('path')
const {parse} = require('babylon')
const traverse = require('babel-traverse')
const bTypes = require('babel-types')
const generate = require('babel-generator')
const template = require('babel-template')
const numToWord = require('number-to-words')
const util = require('util')
const _ = require('lodash')
const kph = require('key-path-helpers')
//http://localhost:63342/bableJsRewrite/index.js
const runPromise = require('./runPromise')
const MemExTests = require('./memExTests')
const MemExprExtractors = require('./memExprExtractors')

///home/john/WebstormProjects/bableJsRewrite/mendy/Helen Palmer - Mendeley_files/index.js
const here = process.cwd()
const mendyIndex = Path.join(here, 'mendy', 'js', 'index.js')

function readJsFile (file) {
  return fs.readFileAsync(file, 'utf8')
}

const winLocIsMemCache = new Map()
const winLocIsMemTestCache = new Map()

function makeWindowLocReplacer (_with) {
  const winlocPropReplacer = template(`${_with}.what`)
  return {
    justSubWindowLoc: template(`${_with}`)(),
    windowLocReplace (what) {
      return winlocPropReplacer({what})
    }
  }
}

function makeWindowLocIsMemReplacerWTest (_with) {
  return (sub) => {
    let i = 0
    let llen = sub.LHS.length
    let realSub = {}
    let realSub2 = {}
    let templeStr = []
    for (; i < llen; ++i) {
      let idx = numToWord.toWordsOrdinal(i)
      realSub[idx] = bTypes.identifier(sub.LHS[i])
      realSub2[idx] = bTypes.identifier(sub.LHS[i])
      templeStr.push(idx)
    }
    let testFun
    if (winLocIsMemTestCache.has(i)) {
      testFun = winLocIsMemTestCache.get(i)
    } else {
      testFun = template(templeStr.join('.'))
      winLocIsMemTestCache.set(i, testFun)
    }
    let nodes = {test: testFun(realSub)}
    let templeStr2 = [...templeStr, 'location']
    templeStr.push(_with)
    if (sub.RHS) {
      let j = 0
      let jlen = sub.RHS.length
      for (; j < jlen; ++j, ++i) {
        let idx = numToWord.toWordsOrdinal(i)
        realSub[idx] = bTypes.identifier(sub.RHS[j])
        realSub2[idx] = bTypes.identifier(sub.RHS[j])
        templeStr.push(idx)
        templeStr2.push(idx)
      }
    }
    let templeFuns
    if (winLocIsMemCache.has(i)) {
      templeFuns = winLocIsMemCache.get(i)
    } else {
      templeFuns = {templeFun: template(templeStr.join('.')), templeFun2: template(templeStr2.join('.'))}
      winLocIsMemCache.set(i, templeFuns)
    }
    nodes.replace = templeFuns.templeFun(realSub)
    nodes.original = templeFuns.templeFun2(realSub2)
    return nodes
  }
}

function makeWindowLocOnSomeObjReplaceWTest (_with) {
  return (sub) => {
    let i = 0
    let llen = sub.LHS.length
    let realSub = {}
    let realSub2 = {}
    let templeStr = []
    for (; i < llen; ++i) {
      let idx = numToWord.toWordsOrdinal(i)
      realSub[idx] = bTypes.identifier(sub.LHS[i])
      realSub2[idx] = bTypes.identifier(sub.LHS[i])
      templeStr.push(idx)
    }

    let testFun
    let templeStr2 = [...templeStr, 'location']
    if (winLocIsMemTestCache.has(i)) {
      testFun = winLocIsMemTestCache.get(i)
    } else {
      testFun = template(templeStr2.join('.'))
      winLocIsMemTestCache.set(i, testFun)
    }
    let nodes = {test: testFun(realSub)}
    templeStr.push(_with)
    if (sub.RHS) {
      let j = 0
      let jlen = sub.RHS.length
      for (; j < jlen; ++j, ++i) {
        let idx = numToWord.toWordsOrdinal(i)
        realSub[idx] = bTypes.identifier(sub.RHS[j])
        realSub2[idx] = bTypes.identifier(sub.RHS[j])
        templeStr.push(idx)
        templeStr2.push(idx)
      }
    }
    let templeFuns
    if (winLocIsMemCache.has(i)) {
      templeFuns = winLocIsMemCache.get(i)
    } else {
      templeFuns = {templeFun: template(templeStr.join('.')), templeFun2: template(templeStr2.join('.'))}
      winLocIsMemCache.set(i, templeFuns)
    }
    nodes.replace = templeFuns.templeFun(realSub)
    nodes.original = templeFuns.templeFun2(realSub2)
    return nodes
  }
}

//window. 12

let programPath
const {justSubWindowLoc, windowLocReplace} = makeWindowLocReplacer('window.WB_wombat_location')
const postMessageReplacement = template('window.__WB_pmw(window).postMessage')()
const postMesageNode = template('window.postMessage')()
const locationNode = template('window.location')()
const windowIsMemLocReplacer = makeWindowLocIsMemReplacerWTest('WB_wombat_location')
const locIsOnSomeObjectReplacer = makeWindowLocOnSomeObjReplaceWTest('WB_wombat_location')

const locOnObject = ({object}) => object && object.property ? bTypes.isIdentifier(object.property, {name: 'location'}) : false

function notNull (it) {
  return !(it === null || it === undefined)
}

function isLocationOnSomeObject (node) {
  let t = bTypes.isIdentifier(node.property, {name: 'location'})
  if (t) {
    return t
  }
  let it = node.object
  while (!(it === null || it === undefined)) {
    if (!it.property) {
      t = bTypes.isIdentifier(it, {name: 'location'})
    }
    if (it.property) {
      t = bTypes.isIdentifier(it.property, {name: 'location'})
    }
    if (t) {
      return t
    }
    it = it.object
  }
  return false
}

function isLocOnSomeObject2 (node) {
  let findings = {t: false, l: [], r: []}
  let t = bTypes.isIdentifier(node.property, {name: 'location'})
  if (t) {
    findings.t = true
  }
  let it = node.object
  while (!(it === null || it === undefined)) {
    if (!it.property) {
      if (bTypes.isIdentifier(it, {name: 'location'})) {
        findings.t = true
      } else {
        if (findings.t) {
          findings.r.unshift(it.name)
        } else {
          findings.l.unshift(it.name)
        }
      }
    }
    if (it.property) {
      if (bTypes.isIdentifier(it.property, {name: 'location'})) {
        findings.t = true
      } else {
        if (findings.t) {
          findings.r.unshift(it.property.name)
        } else {
          findings.l.unshift(it.property.name)
        }
      }
    }
    it = it.object
  }
  return findings
}

function it () {
  this.a = 1
  function it2 () {
    this.a = 2
  }

  it2.bind(it)()
}

function subBind (path, ORG, BIND, SUB, containsThis) {
  let bJoined = BIND.join(',')
  let bindTemplate = template(`function ID (${bJoined}) {
    try {
      return SUB;
    } catch(err) {
      return ORG;
    }
  }`)
  let callBindTemplate = containsThis ? template(`(ID.bind(this,${bJoined}))()`) : template(`(ID.bind(null,${bJoined}))()`)
  callBindTemplate.shouldSkip = true
  let ID = programPath.scope.generateUidIdentifier('bindy')
  BIND = BIND.reduce((acum, it) => {
    acum[it] = bTypes.identifier(it)
    return acum
  }, {})
  let theFun = bindTemplate(Object.assign({ID, ORG, SUB}, BIND))
  programPath.unshiftContainer('body', theFun)
  let callFun = callBindTemplate(Object.assign({ID}, BIND))
  callFun.shouldSkip = true
  path.replaceWith(callFun)
  path.skip()
}

function leftAssignIsLoc (path, left, right) {
  let testTemplate = template(`function ID (L,)`)
}

const visited = new Set()

const testTempl = {
  theTest: template(`function ID (T,G,GG,RE) {if (Object.is(T,G)){return GG;} else {return RE;}}`),
  callTest: template('var TID = ID(T,G,GG,RE);'),
  _callTest2: template('ID(T,G,GG,RE)'),
  callTest2 (T, G, GG, RE) {
    return this._callTest2({T, G, GG, RE})
  },
  lastId: null
}

function insertTestCall (name, path, T, G, GG, RE) {
  let parentBlock = path.find(pp => pp.isBlockStatement())
  let TID = parentBlock.scope.generateUidIdentifier(name)
  let newNode = testTempl.callTest({ID: testTempl.lastId, TID, T, G, GG, RE})
  parentBlock.unshiftContainer('body', newNode)
  path.replaceWith(TID)
}

const ifTTReturnTEleseO = template(`(function () {if(null !== T && void 0 !== T) {console.log('wombat on T',T);return TT;} else {return O;}})()`)
const ifTTReturnTEleseOWThis = template(`(function () {if(null !== T && void 0 !== T) {console.log('wombat on T',T);return TT;} else {return O;}}).bind(this)()`)
const tryNCatchReturnO = template(`(function () { try {return N;} catch(error) {return O;}})()`)
const tryNCatchReturnOWThis = template(`(function () { try {return N;} catch(error) {return O;}}).bind(this)()`)

const locOnSomeObjLAssign = template('(function(){if(null !== L && void 0 !== L){console.log("wombat on L",L);return L = R;}else{return O;}})()')
const locOnSomeObjLAssignWThis = template('(function(){if(null !== L && void 0 !== L){console.log("wombat on L",L);return L = R;}else{return O;}}).bind(this)()')
const locOnSomeObjRAssign = template('(function(){if(null !== R && void 0 !== R){console.log("wombat on R",R);return L = RR;}else{return O;}})()')
const locOnSomeObjRAssignWThis = template('(function(){if(null !== R && void 0 !== R){console.log("wombat on R",R);return L = RR;}else{return O;}}).bind(this)()')

function locOnSomeObjCallMemExprNotSame (path, node, bindThis = false) {
  let opath = 'object'
  let tpath
  let atp
  let found = false
  for (; ; opath += '.object') {
    atp = kph.getValueAtKeyPath(path.node, opath)
    if (!atp) {
      break
    }
    if (found) {
      break
    }
    if (atp.property && atp.property.name === 'location') {
      tpath = opath
      found = true
    }
  }
  if (found) {
    let pnode = bTypes.cloneDeep(node)
    let newObj = bTypes.cloneDeep(kph.getValueAtKeyPath(node, opath))
    try {
      newObj = bTypes.appendToMemberExpression(newObj, bTypes.identifier('WB_wombat_location'))
    } catch (error) {
      return
      // newObj = bTypes.appendToMemberExpression(bTypes.cloneDeep(node.object), bTypes.identifier('WB_wombat_location'))
    }
    let tObject = bTypes.cloneDeep(newObj)
    newObj = bTypes.appendToMemberExpression(newObj, node.property)
    if (bindThis) {
      path.replaceWith(ifTTReturnTEleseOWThis({
        O: pnode,
        TT: newObj,
        T: tObject
      }))
    } else {
      path.replaceWith(ifTTReturnTEleseO({
        O: pnode,
        TT: newObj,
        T: tObject
      }))
    }
  }
}

function locOnSomeObjCallMemExprSame (path, node, bindThis = false) {
  let opath = 'object'
  let tpath
  let atp
  let found = false
  for (; ; opath += '.object') {
    atp = kph.getValueAtKeyPath(path.node, opath)
    if (!atp) {
      break
    }
    if (found) {
      break
    }
    if (atp.property && atp.property.name === 'location') {
      tpath = opath
      found = true
    }
  }
  if (found) {
    let pnode = bTypes.cloneDeep(path.parentPath.node)
    let newObj = bTypes.cloneDeep(kph.getValueAtKeyPath(node, opath))
    try {
      newObj = bTypes.appendToMemberExpression(newObj, bTypes.identifier('WB_wombat_location'))
    } catch (error) {
      return
      // newObj = bTypes.appendToMemberExpression(bTypes.cloneDeep(node.object), bTypes.identifier('WB_wombat_location'))
    }
    // newObj = bTypes.appendToMemberExpression(newObj, bTypes.identifier('WB_wombat_location'))
    newObj = bTypes.appendToMemberExpression(newObj, node.property)
    path.replaceInline(newObj)
    if (bindThis) {
      path.parentPath.replaceInline(tryNCatchReturnOWThis({
        O: pnode,
        N: path.parentPath.node
      }))
    } else {
      path.parentPath.replaceInline(tryNCatchReturnO({
        O: pnode,
        N: path.parentPath.node
      }))
    }
  }
}

function hasThis (path) {
  let search = [path.node]
  while (search.length) {
    const cur = search.shift()
    if (bTypes.isMemberExpression(cur)) {
      search.unshift(cur.property)
      search.unshift(cur.object)
    } else if (bTypes.isThisExpression(cur)) {
      return true
    }
  }
  return false
}

const dontInclude = new Set(['importScripts', 'postMessage'])

function extractIdentifiers (path) {
  //3155.608ms
  let search = [path.node]
  let ids = new Set()
  while (search.length) {
    const cur = search.shift()
    // console.log(cur)
    switch (cur.type) {
      case 'CallExpression':
        search.unshift(cur.callee)
        search = search.concat(cur.arguments)
        break
      case 'MemberExpression':
        search.unshift(cur.object)
        search.unshift(cur.property)
        break
      case 'BinaryExpression':
      case 'LogicalExpression':
        search.unshift(cur.left)
        search.unshift(cur.right)
        break
      case 'UnaryExpression':
        search.unshift(cur.argument)
        break
      case 'Identifier':
        if (!dontInclude.has(cur.name)) {
          ids.add(cur.name)
        }
        break
    }
  }
  return ids
}

const goodRewritter = {
  Program (path) {
    programPath = path
    testTempl.lastId = path.scope.generateUidIdentifier('objectTest')
    path.unshiftContainer('body', testTempl.theTest({
      ID: testTempl.lastId,
      T: path.scope.generateUidIdentifier('T'),
      G: path.scope.generateUidIdentifier('G'),
      GG: path.scope.generateUidIdentifier('GG'),
      RE: path.scope.generateUidIdentifier('RE'),
    }))
  },
  MemberExpression(path) {
    if (visited.has(path.node.loc)) {
      return
    }
    let {node} = path
    if (MemExTests.isWindowMemberExpr(node)) {
      visited.add(path.node.loc)
      if (MemExTests.isWindowDotLocation(node)) {
        console.log('before', generate.default(node, {}, '').code)
        if (node.object.object) {
          // window.location.search
          path.replaceWith(windowLocReplace(path.node.property))
        } else {
          path.replaceWith(justSubWindowLoc)
        }
        console.log('after', generate.default(path.node, {}, '').code)
        visited.add(path.node.loc)
        console.log('-----------------')
      } else if (MemExTests.isWindowPostMessage(node)) {
        console.log('before', generate.default(node, {}, '').code)
        path.replaceWith(postMessageReplacement)
        visited.add(path.node.loc)
        console.log('after', generate.default(path.node, {}, '').code)
        console.log('-----------------')
      }
    } else if (MemExTests.maybeWindowPostMessageCall(path, node)) {
      // // path.scope.crawl()
      let containsThis = hasThis(path)
      visited.add(path.node.loc)
      let funParent = path.getFunctionParent().node
      if (funParent.id && funParent.id.name && funParent.id.name.indexOf('bindy') >= 0) {
        return
      }
      if (bTypes.isCallExpression(path.parentPath.node)) {
        console.log('before', generate.default(path.parentPath.node, {}, '').code)
        let captureIds = extractIdentifiers(path.parentPath)
        visited.add(path.parentPath.node.loc)
        let or = bTypes.cloneDeep(path.parentPath.node)
        path.node.property.name = '__WB_pmw(window).postMessage'
        subBind(path.parentPath, or, Array.from(captureIds), path.parentPath.node, containsThis)
        console.log('after', generate.default(path.parentPath.node, {}, '').code)
        console.log('-----------------')
      } else {
        console.log('before', generate.default(path.parentPath.node, {}, '').code)
        let captureIds = extractIdentifiers(path.parentPath)
        visited.add(path.node.loc)
        let or = bTypes.cloneDeep(path.node)
        path.node.property.name = '__WB_pmw(window).postMessage'
        subBind(path, or, Array.from(captureIds), path.node, containsThis)
        console.log('after', generate.default(path.parentPath.node, {}, '').code)
        console.log('-----------------')
      }
    } else if (isLocationOnSomeObject(node)) {
      let containsThis = hasThis(path)
      visited.add(path.node.loc)
      let type = path.parentPath.type
      visited.add(path.parentPath.node.loc)
      if (type === 'AssignmentExpression') {
        console.log('before', generate.default(path.parentPath.node, {}, '').code)
        let left = path.parentPath.node.left
        let right = path.parentPath.node.right
        if (left.property.name === 'location') {
          visited.add(path.parentPath.node.loc)
          let nLeft = bTypes.cloneDeep(left)
          nLeft.property.name = 'WB_wombat_location'
          if (containsThis) {
            path.parentPath.replaceWith(locOnSomeObjLAssignWThis({
              L: nLeft,
              R: right,
              O: path.parentPath.node
            }))
          } else {
            path.parentPath.replaceWith(locOnSomeObjLAssign({
              L: nLeft,
              R: right,
              O: path.parentPath.node
            }))
          }
        } else if (right.property.name === 'location') {
          visited.add(path.parentPath.node.loc)
          let nRight = bTypes.cloneDeep(right)
          nRight.property.name = 'WB_wombat_location'
          if (containsThis) {
            path.parentPath.replaceWith(locOnSomeObjRAssignWThis({
              R: nRight,
              L: left,
              O: path.parentPath.node
            }))
          } else {
            path.parentPath.replaceWith(locOnSomeObjRAssign({
              R: nRight,
              L: left,
              O: path.parentPath.node
            }))
          }
        }
        console.log('after', generate.default(path.parentPath.node, {}, '').code)

        console.log('-----------------')
      } else if (type === 'CallExpression') {

        console.log('before', generate.default(path.parentPath.node, {}, '').code)
        if (path.parentPath.node.callee.type === 'MemberExpression') {
          if (bTypes.shallowEqual(path.parentPath.node.callee, node)) {
            // calling our own property
            locOnSomeObjCallMemExprSame(path, node, containsThis)
          } else {
            locOnSomeObjCallMemExprNotSame(path, node, containsThis)
          }
        } else {
          if (node.property.name === 'location') {
            let newNode = bTypes.cloneDeep(path.node)
            newNode.property.name = 'WB_wombat_location'
            if (containsThis) {
              path.replaceWith(ifTTReturnTEleseOWThis({
                O: path.node,
                TT: newNode,
                T: newNode
              }))
            } else {
              path.replaceWith(ifTTReturnTEleseO({
                O: path.node,
                TT: newNode,
                T: newNode
              }))
            }
          } else {
            locOnSomeObjCallMemExprNotSame(path, node, containsThis)
          }
        }
        console.log('after', generate.default(path.parentPath.node, {}, '').code)
        console.log('-----------------')
      } else {
        visited.add(path.node.loc)
        console.log('before', generate.default(path.node, {}, '').code)
        if (node.property.name === 'location') {
          let newNode = bTypes.cloneDeep(path.node)
          newNode.property.name = 'WB_wombat_location'
          if (containsThis) {
            path.replaceWith(ifTTReturnTEleseOWThis({
              O: path.node,
              TT: newNode,
              T: newNode
            }))
          } else {
            path.replaceWith(ifTTReturnTEleseO({
              O: path.node,
              TT: newNode,
              T: newNode
            }))
          }

        } else {
          // console.log('ads')
          // console.log(generate.default(path.parentPath.parentPath.node, {}, '').code)
          locOnSomeObjCallMemExprNotSame(path, node, containsThis)
          // console.log(generate.default(path.parentPath.parentPath.node, {}, '').code)
        }
        console.log('after', generate.default(path.node, {}, '').code)
        console.log('-----------------')

      }
      // console.log(generate.default(path.parentPath.parentPath.node, {}, '').code)
    }

  }
}

async function doIt () {
  const indexJs = await readJsFile(mendyIndex)
  const ast = parse(indexJs, {plugins: ['jsx']})
  console.time('travers')
  traverse.default(ast, {
    Identifier(path) {
      let name = path.node.name
      let pPath = path.parentPath
      if (name === 'window' || name === 'top' || name === 'location') {
        if (pPath.type === 'MemberExpression') {
          let obj = pPath.node.object
          if (!obj.object && (obj.name === 'window' || obj.name === 'top' || obj.name === 'location')) {
            // console.log(generate.default(pPath.node, {}, '').code)
          }
        } else if (pPath.type === 'ObjectProperty') {
          let value = pPath.node.value
          if (value.type === 'Identifier' && (value.name === 'window' || value.name === 'top' || value.name === 'location')) {
            // console.log(name)
            // console.log(generate.default(pPath.node, {}, '').code)
          } else if (value.type === 'MemberExpression') {
            let obj = value.object
            if (!obj.object && (obj.name === 'window' || obj.name === 'top' || obj.name === 'location')) {
              // console.log(generate.default(pPath.node, {}, '').code)
            } else {
              console.log(generate.default(pPath.node, {}, '').code)
            }
            // console.log(value.type)
          }

        } else {
          // console.log(generate.default(pPath.node, {}, '').code)
          // console.log(pPath.type)
        }
        // let sparent = path.getStatementParent()
        // console.log(sparent.type)
        // console.log(path.parentPath.type)
        // console.log(generate.default(path.parentPath.node, {}, '').code)
        console.log('-------------')
      }
    }
  })
  console.timeEnd('travers')
  // await fs.writeFileAsync('index.js', generate.default(ast, {}, '').code, 'utf8')
}

// const ast = parse('window.location.reload', {plugins: ['jsx']})
// traverse.default(ast, {
//   MemberExpression(path) {
//     if (path.node.property.name === 'location') {
//
//     } else {
//
//       console.log(generate.default(, {}, '').code)
//       console.log()
//       process.exit()
//     }
//
//     let it = path.node.object
//     // if (it.property.name === 'location') {
//     //   opath += '.object'
//     // } else {
//     //   do {
//     //     it = it.object
//     //     if (it.property.name !== 'location') {
//     //       opath += '.object'
//     //     } else {
//     //       break
//     //     }
//     //   } while (!(it === null || it === undefined))
//     // }
//
//   }
// })

runPromise(doIt)

