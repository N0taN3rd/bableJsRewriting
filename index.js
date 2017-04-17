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

const runPromise = require('./lib/runPromise')
const MemExTests = require('./lib/memExTests')
const MemExprExtractors = require('./lib/memExprExtractors')

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
      t = bTypes.isIdentifier(node, {name: 'location'})
    }
    if (t) {
      return t
    }
    if (it.property) {
      t = bTypes.isIdentifier(node.property, {name: 'location'})
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

function subBind (path, ORG, BIND, SUB) {
  let bJoined = BIND.join(',')
  let bindTemplate = template(`function ID (${bJoined}) {
    try {
      return SUB;
    } catch(err) {
      return ORG;
    }
  }`)
  let callBindTemplate = template(`(ID.bind(null,${bJoined}))()`)
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

const originalRW = {
  Program (path) {
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
    if (MemExTests.isWindowMemberExpr(path.node)) {
      if (MemExTests.isWindowDotLocation(path.node)) {
        if (bTypes.isMemberExpression(path.node.object)) {
          path.replaceWith(windowLocReplace(path.node.property))
        } else {
          path.replaceWith(justSubWindowLoc)
        }
        visited.add(path.node.loc)
      } else if (MemExTests.isWindowPostMessage(path.node)) {
        path.replaceWith(postMessageReplacement)
        visited.add(path.node.loc)
      }
    } else if (MemExTests.isWindowAMember(path.node) && MemExTests.isWindowDotLocation(path.node)) {
      let sub = MemExprExtractors.extractWindowMemberLocation(path.node)
      let {test, replace, original} = windowIsMemLocReplacer(sub)
      insertTestCall('anObjectTest', path, test, bTypes.identifier('window'), replace, original)
      visited.add(path.node.loc)
    } else {
      if (MemExTests.isWindowPostMessage(path.node) && !MemExTests.isPortTwo(path.node.object)) {
        if (!bTypes.isCallExpression(path.parentPath)) {
          return
        }
        visited.add(path.node.loc)
        insertTestCall('anObjectTest', path, path.node, postMesageNode, postMessageReplacement, path.node)
      } else {
        if (bTypes.isIdentifier(path.node.property, {name: 'location'})) {
          visited.add(path.node.loc)
          insertTestCall('anObjectTest', path, path.node, locationNode, locationNode, path.node)
        } else if (locOnObject(path.node)) {
          visited.add(path.node.loc)
          let sub = MemExprExtractors.simpleExtractLocOnObject(path.node)
          let {test, replace, original} = locIsOnSomeObjectReplacer(sub)
          insertTestCall('anObjectTest', path, test, locationNode, replace, original)
        }
      }
    }
  }
}

const idGetter = {
  Identifier (path) {
    if (path.node.name !== 'postMessage') {
      this.captureIds.add(path.node.name)
    }
  }
}

const locationProps = new Set(['href', 'protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash',
  'origin', 'assign', 'reload', 'reload', 'replace'])

async function doIt () {
  const indexJs = await readJsFile(mendyIndex)
  const ast = parse(indexJs, {plugins: ['jsx']})
  console.time('travers')
  traverse.default(ast, {
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
      path.scope.crawl()
    },
    MemberExpression(path) {
      if (visited.has(path.node.loc)) {
        return
      }
      let {node} = path
      if (MemExTests.isWindowMemberExpr(node)) {
        // if (MemExTests.isWindowDotLocation(node)) {
        //   if (node.object.object) {
        //     // window.location.search
        //     path.replaceWith(windowLocReplace(path.node.property))
        //   } else {
        //     path.replaceWith(justSubWindowLoc)
        //   }
        //   visited.add(path.node.loc)
        // } else if (MemExTests.isWindowPostMessage(node)) {
        //   path.replaceWith(postMessageReplacement)
        //   visited.add(path.node.loc)
        // }
      } else if (MemExTests.maybeWindowPostMessageCall(path, node)) {
        // // path.scope.crawl()
        // visited.add(path.node.loc)
        // let funParent = path.getFunctionParent().node
        // if (funParent.id && funParent.id.name && funParent.id.name.indexOf('bindy') >= 0) {
        //   return
        // }
        // if (bTypes.isCallExpression(path.parentPath.node)) {
        //   let captureIds = new Set()
        //   // console.log(path.parentPath)
        //   // console.log(path.parentPath.node.callee)
        //   path.parentPath.traverse(idGetter, {captureIds})
        //   visited.add(path.parentPath.node.loc)
        //   let or = _.cloneDeep(path.parentPath.node)
        //   path.node.property.name = '__WB_pmw(window).postMessage'
        //   subBind(path.parentPath, or, Array.from(captureIds), path.parentPath.node)
        // } else {
        //   let captureIds = new Set()
        //   path.traverse(idGetter, {captureIds})
        //   visited.add(path.node.loc)
        //   let or = _.cloneDeep(path.node)
        //   path.node.property.name = '__WB_pmw(window).postMessage'
        //   subBind(path, or, Array.from(captureIds), path.node)
        // }
        //
      } else {//if (isLocationOnSomeObject(node)) {
        let findings = isLocOnSomeObject2(node)
        if (findings.t) {
          console.log(findings.l, findings.r)
          let type = path.parentPath.type
          if (type === 'AssignmentExpression') {
            visited.add(path.node.loc)
            let left = path.parentPath.node.left
            if (left.property.name === 'location') {
              let lo = generate.default(left, {}, '').code
              console.log(path.parentPath.___VISITED)
              /*
               (function(){if(Object.is(${lo},window.location){window.WB_wombat_location=${generate.default(path.parentPath.node.right, {}, '').code}}else{return ${generate.default(path.parentPath.node, {}, '').code}})()`
               */
              path.parentPath.replaceWithSourceString(`(function(){if(Object.is(${lo}, window.location)){return window.WB_wombat_location=${generate.default(path.parentPath.node.right, {}, '').code}} else { return ${generate.default(path.parentPath.node, {}, '').code}}})()`)
              Object.defineProperty(path.parentPath.node, '___VISITED', {value: true})
            }
          }
        }

      }
    }
  })
  console.timeEnd('travers')
  await fs.writeFileAsync('mindex.js', generate.default(ast, {}, '').code, 'utf8')
}

runPromise(doIt)

