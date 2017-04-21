"use strict";
//http://localhost:63343/bableJsRewrite/mindex2.js
let _________noModify_________ = {}
for (let it of Object.getOwnPropertyNames(window)) {
  if (/[A-Z]/.test(it[0]) && typeof window[it] === 'function') {
    _________noModify_________[it] = true
  }
}
let _________win_________ = window
function _________MAKEPROX_________ (__win__) {
  return new Proxy(__win__, {
    get (target, what) {
      console.log(what)
      // let retVal = target[what];
      // if (typeof retVal === 'function') {
      //   return retVal.bind(target)
      // }
      // return retVal
      switch (what) {
        case '_________PROX_________':
          return true
        case 'postMessage':
          return target.__WB_pmw(target).postMessage.bind(target.__WB_pmw(target))
        default: {
          let retVal = target[what]
          if (_________noModify_________[what]) {
            return retVal
          }
          if (typeof retVal === 'function') {
            return retVal.bind(target)
          }
          return retVal
        }
      }
    },
    set (target, prop, value) {
      // return target[prop] = value
      switch (prop) {
        case '_________PROX_________':
          return true
        case 'location':
          target.WB_wombat_location = prop
          return true
        case 'top':
          target.WB_wombat_top = value
          return true
        case 'postMessage':
          target.__WB_pmw(target).postMessage = value
          return true
        default:
          target[prop] = value
          return true
      }
    },
    has (target, key) {
      return key in target
    },
  })
}
// {
//   let location = _________win_________.WB_wombat_location
//   let top = _________win_________.WB_wombat_top
//   let window = _________MAKEPROX_________(_________win_________)
//   let map = new window.Map()
//   console.log(window._________PROX_________ = 1)
//   console.log(Object.getOwnPropertyDescriptor(window))
//   var start = null;
//   var element = document.getElementById('it');
//   element.style.position = 'absolute'
//   function step(timestamp) {
//     if (!start) start = timestamp;
//     var progress = timestamp - start;
//     element.style.left = Math.max(progress / 10, 200) + 'px';
//     if (progress < 2000) {
//       window.requestAnimationFrame(step);
//     }
//   }
//
//   window.requestAnimationFrame(step)
// }

let nw = {}
for (let it of Object.getOwnPropertyNames(window)) {
  if (/[A-Z]/.test(it[0]) && typeof window[it] === 'function') {
    nw[it] = it
  }
}

// {
//   let _________noModify_________ = {}
//   for (let it of Object.getOwnPropertyNames(window)) {
//     if (/[A-Z]/.test(it[0]) && typeof window[it] === 'function') {
//       _________noModify_________[it] = true
//     }
//   }
//   function _________MAKEPROX_________ (__win__) {
//     return new Proxy(__win__, {
//       get(target, what) {
//         console.log(what)
//         // let retVal = target[what];
//         // if (typeof retVal === 'function') {
//         //   return retVal.bind(target)
//         // }
//         // return retVal
//         switch (what) {
//           case 'location':
//             return target.WB_wombat_location
//           case 'postMessage':
//             return target.__WB_pmw(target).postMessage.bind(target.__WB_pmw(target))
//           default:
//             let retVal = target[what]
//             if (_________noModify_________[what]) {
//               return retVal
//             }
//             if (typeof retVal === 'function') {
//               return retVal.bind(target)
//             }
//             return retVal
//         }
//       },
//       set(target, prop, value) {
//         // return target[prop] = value
//         console.log(prop, value)
//         switch (prop) {
//           case 'location':
//             target.WB_wombat_location = prop
//             return true
//           case 'top':
//             target.WB_wombat_top = value
//             return true
//           case 'postMessage':
//             target.__WB_pmw(target).postMessage = value
//             return true
//           default:
//             target[prop] = value
//             return true
//         }
//       },
//       has(target, key) {
//         return key in target
//       }
//     })
//   }
//
//   let _________win_________ = window
//   {
//     let location = _________win_________.WB_wombat_location
//     let top = _________win_________.WB_wombat_top
//     let window = _________MAKEPROX_________(_________win_________)
//   }
//
// }
let _win_ = window
{
  console.log(XYZ)
  console.log(_win_.XYZ)
  let window = {}
  var XYZ = XYZ || {a: 'a'};
  console.log(XYZ)
  console.log(_win_.XYZ)
  console.log(window.XYZ)
  var hi = 123
}

console.log(hi)
console.log(XYZ)
console.log(window.XYZ)
console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');
