const bTypes = require('babel-types')
const MemExTests = require('./memExTests')

module.exports = class MemExprExtractors {
  static extractWindowMemberLocation (node) {
    let it = node.object
    let doRhs = false
    const isLocationTerminal = bTypes.isIdentifier(node.property, {name: 'location'})
    const LHS = []
    const RHS = []
    while (it) {
      if (bTypes.isThisExpression(it)) {
        LHS.unshift('this')
      } else if (MemExTests.isPropLoc(it)) {
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

  static simpleExtractLocOnObject (node) {
    let it = node.object
    const isLocationTerminal = bTypes.isIdentifier(node.property, {name: 'location'})
    const LHS = []
    const RHS = []
    while (it) {
      if (MemExTests.isPropLoc(it)) {
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
}