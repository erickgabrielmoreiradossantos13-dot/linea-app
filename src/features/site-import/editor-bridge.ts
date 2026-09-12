function appendBeforeBody(html: string, addition: string) {
  const index = html.toLowerCase().lastIndexOf("</body>");
  return index >= 0 ? `${html.slice(0, index)}${addition}${html.slice(index)}` : `${html}${addition}`;
}

export function injectEditorBridge(html: string, editable: boolean) {
  if (!editable) return html;
  const bridge = `<style id="linea-editor-style">
[data-linea-block]{position:relative;outline:1px dashed transparent;outline-offset:4px;transition:outline-color .15s,box-shadow .15s}
[data-linea-block]:hover,[data-linea-block].linea-active{outline:2px solid #ff5a3c!important;outline-offset:4px;box-shadow:0 0 0 5px rgba(255,90,60,.12)}
[data-linea-kind="html_text"],[data-linea-field]{cursor:text}
[data-linea-kind="html_image"],img[data-linea-field]{cursor:pointer}
#linea-node-tools{position:fixed;z-index:2147483647;display:none;align-items:center;gap:3px;padding:4px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:#101923;color:white;box-shadow:0 10px 28px rgba(0,0,0,.38);font:600 11px/1 system-ui,sans-serif}
#linea-node-tools button{display:grid;place-items:center;width:30px;height:28px;border:0;border-radius:5px;background:transparent;color:white;cursor:pointer;font:700 13px/1 system-ui,sans-serif}
#linea-node-tools button:hover{background:rgba(255,255,255,.13)}
#linea-node-label{padding:0 7px;color:#ff9b88;text-transform:uppercase;letter-spacing:.08em;font-size:9px}
.linea-item-remove{position:absolute!important;z-index:2147483646!important;top:4px!important;right:4px!important;width:25px!important;height:25px!important;border:0!important;border-radius:99px!important;background:#101923!important;color:#fff!important;cursor:pointer!important;font:700 14px/1 system-ui!important;opacity:0!important}.linea-item-remove:focus,[data-linea-item]:hover>.linea-item-remove{opacity:1!important}
</style><script id="linea-editor-bridge">(()=>{
const send=(payload)=>parent.postMessage({source:'linea-editor',...payload},'*');
const tools=document.createElement('div');tools.id='linea-node-tools';tools.innerHTML='<span id="linea-node-label">Elemento</span><button data-action="up" title="Mover para cima">↑</button><button data-action="down" title="Mover para baixo">↓</button><button data-action="duplicate" title="Duplicar">⧉</button><button data-action="remove" title="Remover">×</button>';document.body.appendChild(tools);
let active=null;let start='';
const activate=(block)=>{if(active)active.classList.remove('linea-active');active=block;block.classList.add('linea-active');const rect=block.getBoundingClientRect();tools.style.display='flex';tools.style.left=Math.max(8,Math.min(innerWidth-tools.offsetWidth-8,rect.right-tools.offsetWidth))+'px';tools.style.top=Math.max(8,rect.top-38)+'px';const kind=block.dataset.lineaKind||'elemento';tools.querySelector('#linea-node-label').textContent=kind.replace('html_','');};
document.querySelectorAll('[data-linea-block]').forEach((block)=>{
 block.addEventListener('mouseenter',()=>activate(block));
 const kind=block.dataset.lineaKind;
 if(kind==='html_text'){block.contentEditable='true';block.spellcheck=true;block.addEventListener('focus',()=>{start=block.textContent||''});block.addEventListener('blur',()=>{const value=block.textContent||'';if(value!==start)send({type:'save-text',blockId:block.dataset.lineaBlock,before:start,value})});}
 if(kind==='html_image'){block.addEventListener('click',(event)=>{event.preventDefault();activate(block);send({type:'pick-image',blockId:block.dataset.lineaBlock})});}
 if(kind==='html_list'){block.querySelectorAll('[data-linea-item]').forEach((item)=>{if(getComputedStyle(item).position==='static')item.style.position='relative';const remove=document.createElement('button');remove.className='linea-item-remove';remove.type='button';remove.title='Remover item';remove.textContent='×';remove.addEventListener('click',(event)=>{event.preventDefault();event.stopPropagation();send({type:'remove-list-item',blockId:block.dataset.lineaBlock,itemId:item.dataset.lineaItem})});item.appendChild(remove)});block.querySelectorAll('[data-linea-field]').forEach((field)=>{const item=field.closest('[data-linea-item]');if(field.tagName==='IMG'){field.addEventListener('click',(event)=>{event.preventDefault();send({type:'pick-image',blockId:block.dataset.lineaBlock,itemId:item?.dataset.lineaItem,fieldId:field.dataset.lineaField})})}else{field.contentEditable='true';field.spellcheck=true;field.addEventListener('focus',()=>{start=field.textContent||''});field.addEventListener('blur',()=>{const value=field.textContent||'';if(value!==start)send({type:'save-text',blockId:block.dataset.lineaBlock,itemId:item?.dataset.lineaItem,fieldId:field.dataset.lineaField,before:start,value})})}})};
});
tools.addEventListener('mouseenter',()=>{if(active)active.classList.add('linea-active')});
tools.querySelectorAll('button').forEach((button)=>button.addEventListener('click',()=>{if(active)send({type:'block-action',blockId:active.dataset.lineaBlock,action:button.dataset.action})}));
addEventListener('scroll',()=>{if(active)activate(active)},{passive:true});addEventListener('resize',()=>{if(active)activate(active)});
document.addEventListener('click',(event)=>{const link=event.target.closest('a');if(link)event.preventDefault()},true);
send({type:'ready'});
})();</script>`;
  return appendBeforeBody(html, bridge);
}
