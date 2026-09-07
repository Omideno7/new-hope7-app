/* Keep real modal locks; recover only locks whose owning overlay is gone. */
(()=>{'use strict';if(window.__NH7_SCROLL_439)return;window.__NH7_SCROLL_439=true;
const owners={'nh7-f4-open':'.nh7-f4-overlay','nh7-v239-preview-open':'.nh7-v239-preview-overlay,.nh7-doc-fullpreview,.nh7-v239-full-preview','nh7-student-modal-open':'.student-modal-backdrop,.nh7-clean-student-backdrop'};
function recover(){for(const [name,selector] of Object.entries(owners)){if(document.body.classList.contains(name)&&!document.querySelector(selector))document.body.classList.remove(name)}}
window.addEventListener('pageshow',recover);document.addEventListener('nh7:admin-render',recover);
window.NH7_ADMIN_CLEAN_SCROLL_VERSION='4.3.9-native-scroll';
})();
