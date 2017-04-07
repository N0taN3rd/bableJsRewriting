const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs-extra'))
const Path = require('path')
const {parse} = require('babylon')
const traverse = require('babel-traverse')
const bTypes = require('babel-types')
const generate = require('babel-generator')
const template = require('babel-template')
const numToWord = require('number-to-words')

///home/john/WebstormProjects/bableJsRewrite/mendy/Helen Palmer - Mendeley_files/index.js
const here = process.cwd()
const mendyIndex = Path.join(here, 'mendy', 'js', 'index.js')

function thenNoop () {}
function defaultCatcher (err) {console.error(err)}

function runPromise (runnable, thener = thenNoop, catcher = defaultCatcher) {
  if (typeof runnable.then === 'function') {
    runnable.then(thener).catch(catcher)
  } else {
    runnable().then(thener).catch(catcher)
  }
}

function readJsFile (file) {
  return fs.readFileAsync(file, 'utf8')
}

const winLocIsMemCache = new Map()
const winLocIsMemTestCache = new Map()

function isPropLoc ({property}) {
  return bTypes.isIdentifier(property, {name: 'location'})
}

function isWindowMemberExpr (node) {
  const t1 = bTypes.isIdentifier(node.object, {name: 'window'})
  if (t1) {return t1}
  let {object} = node.object
  return bTypes.isIdentifier(object, {name: 'window'})
}

function isWindowDotLocation (node) {
  return bTypes.isIdentifier(node.property, {name: 'location'}) ||
    bTypes.isIdentifier(node.object.property, {name: 'location'})
}

function isWindowPostMessage (node) {
  return bTypes.isIdentifier(node.property, {name: 'postMessage'})
}

function isWindowAMember (node) {
  const t1 = bTypes.isIdentifier(node.property, {name: 'window'})
  if (t1) {return t1}
  let it = node.object
  let t2
  while (it) {
    t2 = bTypes.isIdentifier(it.property, {name: 'window'})
    if (t2) {return t2}
    it = it.object
  }
  return false
}


function makeWindowLocReplacer (_with) {
  const winlocPropReplacer = template(`${_with}.what`)
  return {
    justSubWindowLoc: template(`${_with}`),
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

function extractWindowMemberLocation (node) {
  let it = node.object
  let doRhs = false
  const isLocationTerminal = bTypes.isIdentifier(node.property, {name: 'location'})
  const LHS = []
  const RHS = []
  while (it) {
    if (bTypes.isThisExpression(it)) {
      LHS.unshift('this')
    } else if (isPropLoc(it)) {
      if (isLocationTerminal) {
        break
      }
    } else if (doRhs) {
      RHS.unshift(it.property.name)
    } else {
      LHS.unshift(it.property.name)
    }
    it = it.object
  }
  if (!isLocationTerminal) {
    RHS.push(node.property.name)
    return {LHS, RHS}
  } else {
    return {LHS}
  }
}

function simpleExtractLocOnObject (node) {
  let it = node.object
  const isLocationTerminal = bTypes.isIdentifier(node.property, {name: 'location'})
  const LHS = []
  const RHS = []
  while (it) {
    if (isPropLoc(it)) {
      if (isLocationTerminal) {
        break
      }
    } else {
      if (it.name) {
        LHS.unshift(it.name)
      } else if (it.property) {
        LHS.unshift(it.property.name)
      }
    }
    it = it.object
  }
  if (!isLocationTerminal) {
    RHS.push(node.property.name)
    return {LHS, RHS}
  } else {
    return {LHS}
  }
}

function isPortTwo (node) {
  if (node.property) {
    return bTypes.isIdentifier(node.property, {name: 'port2'})
  }
  return false
}

//window. 12

const {justSubWindowLoc, windowLocReplace} = makeWindowLocReplacer('window.WB_wombat_location')
const postMessageReplacement = template('window.__WB_pmw(window).postMessage')()
const postMesageNode = template('window.postMessage')()
const locationNode = template('window.location')()
const windowIsMemLocReplacer = makeWindowLocIsMemReplacerWTest('WB_wombat_location')
const locIsOnSomeObjectReplacer = makeWindowLocOnSomeObjReplaceWTest('WB_wombat_location')

const locOnObject = ({object}) => object && object.property ? bTypes.isIdentifier(object.property, {name: 'location'}) : false

const visited = new Set()

const testTempl = {
  theTest: template(`function ID (T,G,GG,RE) {if (Object.is(T,G)){return GG;} else {return RE;}}`),
  callTest: template('var TID = ID(T,G,GG,RE);'),
  lastId: null
}

function insertTestCall (name, path, T, G, GG, RE) {
  let parentBlock = path.find(pp => pp.isBlockStatement())
  let TID = parentBlock.scope.generateUidIdentifier(name)
  let newNode = testTempl.callTest({ID: testTempl.lastId, TID, T, G, GG, RE})
  parentBlock.unshiftContainer('body', newNode)
  path.replaceWith(TID)
}

async function doIt () {
  const indexJs = await readJsFile(mendyIndex)
  const ast = parse(indexJs)
  console.time('travers')
  traverse.default(ast, {
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
        if (isWindowMemberExpr(path.node)) {
          if (isWindowDotLocation(path.node)) {
            if (bTypes.isMemberExpression(path.node.object)) {
              path.replaceWith(windowLocReplace(path.node.property))
            } else {
              path.replaceWith(justSubWindowLoc())
            }
            visited.add(path.node.loc)
          } else if (isWindowPostMessage(path.node)) {
            path.replaceWith(postMessageReplacement)
            visited.add(path.node.loc)
          }
        } else if (isWindowAMember(path.node) && isWindowDotLocation(path.node)) {
          let sub = extractWindowMemberLocation(path.node)
          let {test, replace, original} = windowIsMemLocReplacer(sub)
          insertTestCall('anObjectTest', path, test, bTypes.identifier('window'), replace, original)
          visited.add(path.node.loc)
        } else {
          if (isWindowPostMessage(path.node) && !isPortTwo(path.node.object)) {
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
              let sub = simpleExtractLocOnObject(path.node)
              let {test, replace, original} = locIsOnSomeObjectReplacer(sub)
              insertTestCall('anObjectTest', path, test, locationNode, replace, original)
            }
          }
        }
      }
    }
  )
  console.timeEnd('travers')
  await fs.writeFileAsync('mindex.js', generate.default(ast, {}, '').code, 'utf8')
}

runPromise(doIt)

