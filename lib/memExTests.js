const bTypes = require('babel-types')

module.exports = class MemExTests {
  static isWindowMemberExpr (node) {
    const t1 = bTypes.isIdentifier(node.object, {name: 'window'})
    if (t1) {return t1}
    let {object} = node.object
    return bTypes.isIdentifier(object, {name: 'window'})
  }

  static isWindowDotLocation (node) {
    return bTypes.isIdentifier(node.property, {name: 'location'}) ||
      bTypes.isIdentifier(node.object.property, {name: 'location'})
  }

  static isWindowPostMessage (node) {
    return bTypes.isIdentifier(node.property, {name: 'postMessage'})
  }

  static maybeWindowPostMessageCall (path, node) {
    if (bTypes.isIdentifier(node.property, {name: 'postMessage'})) {
      if (bTypes.isMemberExpression(node.object)) {
        let it = node.object
        while (!!it) {
          let pname
          if (it.name) {
            pname = it.name
          } else if (it.property) {
            pname = it.property.name
          }
          if (pname === 'port2') {
            return false
          }
          it = it.object
        }
      }
      return true
    }
    return false
  }

  static isWindowAMember (node) {
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

  static isPropLoc ({property}) {
    return bTypes.isIdentifier(property, {name: 'location'})
  }

  static isPortTwo (node) {
    if (node.property) {
      return bTypes.isIdentifier(node.property, {name: 'port2'})
    }
    return false
  }
}