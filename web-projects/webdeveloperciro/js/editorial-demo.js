(() => {
'use strict';
const app = document.querySelector('[data-editorial-app]');
if (!app) return;
const $ = s => app.querySelector(s), $$ = s => [...app.querySelectorAll(s)];
const form=$('[data-editorial-editor]'), title=$('#quaderno-titolo'), category=$('#quaderno-categoria'), text=$('#quaderno-testo');
const list=$('[data-editorial-list]'), reader=$('[data-editorial-reader]'), preview=$('.editorial-preview'), screen=$('[data-editorial-screen]'), pad=$('.editorial-screen-pad');
const status=$('[data-editorial-status]'), titleError=$('#quaderno-titolo-error'), fileError=$('#quaderno-foto-error'), photo=$('#quaderno-foto');
const range=$('#quaderno-larghezza'), state=$('[data-editorial-state]'), resetCheck=$('[data-editorial-reset-check]');
const narrow=matchMedia('(max-width:850px)'), reduced=matchMedia('(prefers-reduced-motion:reduce)');
const covers={};
$$('[data-editorial-cover]').forEach(b=>{covers[b.dataset.qCover]={src:b.querySelector('img').src,alt:b.dataset.qCover==='walk'?'Passeggiata su un sentiero con vista sul lago':'Fiori, una tazza e una busta su un tavolo',label:b.textContent.replace('✓','').trim()};});
const sample=(id,t,c,b,cover)=>({id,published:{title:t,category:c,text:b,cover,custom:null}});
const defaults=[
sample(1,'Una passeggiata senza fretta','Vita all’aperto','Ho lasciato a casa la fretta e seguito un sentiero tra gli alberi. La luce del pomeriggio, il rumore dei passi, qualche minuto tutto per me.\n\nAl ritorno ho appuntato sul quaderno le cose che avevo notato. A volte una storia comincia proprio così: da un momento semplice che vale la pena raccontare.','walk'),
sample(2,'Il tempo delle piccole cose','Piccoli gesti','Un fiore sul tavolo, una tazza ancora calda e due righe da dedicare a qualcuno. Oggi ho scelto di cominciare dalle piccole cose.\n\nLe ho raccolte qui, per ricordarmi che non servono occasioni speciali per fermarsi un momento e trovare qualcosa da condividere.','flowers')
];
const clone=v=>JSON.parse(JSON.stringify(v));
let entries=[],selectedId=1,counter=2,view='article',device='wide',mobilePanel='edit',uploadToken=0,uploading=false;
const entry=()=>entries.find(e=>e.id===selectedId);
const dirty=e=>JSON.stringify(e.draft)!==JSON.stringify(e.published);
const imgData=d=>d.cover==='custom'&&d.custom?{src:d.custom,alt:'Copertina scelta per questa prova'}:covers[d.cover]||covers.walk;
const message=(s,error=false)=>{status.textContent=s;status.classList.toggle('is-error',error);};
const element=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el;};
const image=(d,cls)=>{const m=imgData(d),im=element('img',cls);im.src=m.src;im.alt=m.alt;im.decoding='async';return im;};
const clearTitleError=()=>{titleError.hidden=true;titleError.textContent='';title.removeAttribute('aria-invalid');};
const setViewButtons=()=>{$$('[data-editorial-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qView===view)));$('[data-editorial-preview-label]').textContent=view==='list'?'L’elenco che vedranno i lettori':'La pagina dedicata all’articolo';};
const focusReader=()=>{reader.tabIndex=-1;reader.focus({preventScroll:true});};
const renderList=()=>{
const active=document.activeElement,focusId=list.contains(active)?active.closest('[data-editorial-entry]')?.dataset.qEntry:null;
const fragment=document.createDocumentFragment();
entries.forEach(e=>{
const d=e.published||e.draft,button=element('button','editorial-entry');button.type='button';button.dataset.qEntry=String(e.id);button.setAttribute('aria-pressed',String(e.id===selectedId));
const im=image(d,'');im.alt='';im.width=62;im.height=56;
const copy=element('span',''),name=element('strong','',(d.title||'').trim()||'Articolo senza titolo');
copy.append(name,element('small','',dirty(e)?'Bozza con modifiche':e.published?'Articolo di esempio':'Nuova bozza'));
button.append(im,copy);button.addEventListener('click',()=>select(e.id));fragment.append(button);
});
list.replaceChildren(fragment);
if(focusId)$('[data-editorial-entry="'+focusId+'"]')?.focus({preventScroll:true});
$('[data-editorial-new]').disabled=entries.length>=6;
};
const renderReader=()=>{
const fragment=document.createDocumentFragment();
if(view==='article'){
const d=entry().draft,post=element('article','editorial-post'),heading=element('div','editorial-post-heading');
heading.append(element('span','editorial-category',d.category),element('h5','',(d.title||'').trim()||'Il titolo del tuo articolo'),element('span','editorial-byline','Articolo di esempio'));
const body=element('div','editorial-post-body');
const paragraphs=d.text.trim()?d.text.split(/\n\s*\n/):['Qui apparirà il testo che scrivi.'];
paragraphs.forEach(p=>body.append(element('p','',p)));
const back=element('button','editorial-back','← Tutti gli articoli');back.type='button';back.addEventListener('click',()=>{setView('list');focusReader();});
post.append(heading,image(d,'editorial-post-cover'),body,back);fragment.append(post);
} else {
fragment.append(element('h5','editorial-reader-title','Il mio Quaderno'),element('p','editorial-reader-intro','Pensieri e piccole scoperte, da condividere.'));
const grid=element('div','editorial-post-grid');
entries.filter(e=>e.published||e.id===selectedId).forEach(e=>{
const d=e.id===selectedId?e.draft:e.published,card=element('article','editorial-card'),copy=element('div','editorial-card-copy');
const excerpt=d.text.trim();
copy.append(element('span','editorial-category',d.category),element('h5','',d.title.trim()||'Il titolo del tuo articolo'),element('p','',excerpt.length>105?excerpt.slice(0,102).trim()+'…':excerpt||'Il tuo testo apparirà qui.'));
const button=element('button','','Leggi l’articolo →');button.type='button';button.setAttribute('aria-label','Leggi '+(d.title.trim()||'il nuovo articolo'));button.addEventListener('click',()=>{select(e.id,false);setView('article');focusReader();});
copy.append(button);card.append(image(d,''),copy);grid.append(card);
});
fragment.append(grid);
}
reader.replaceChildren(fragment);setViewButtons();
};
const renderState=()=>{
const changed=dirty(entry());state.textContent=changed?'Modifiche da pubblicare':'Pronto da modificare';state.classList.toggle('is-dirty',changed);
$('[data-editorial-save-note]').textContent=changed?'Le modifiche sono nell’anteprima. Pubblicale nella prova per aggiornare anche l’elenco.':'Le modifiche compaiono subito nell’anteprima.';
$('[data-editorial-preview-badge]').textContent=changed?'Con le tue modifiche':'Anteprima';
$$('[data-editorial-cover]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qCover===entry().draft.cover)));
};
const sizePreview=()=>{
if(!pad.clientWidth)return;
const max=pad.clientWidth,min=Math.min(245,max);
const target=device==='phone'?Math.min(320,max):device==='custom'?Math.max(min,max*Number(range.value)/100):max;
screen.style.width=Math.round(target)+'px';screen.classList.toggle('is-phone',device==='phone');
$$('[data-editorial-device]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qDevice===device)));
range.disabled=max<=245;
requestAnimationFrame(()=>{const w=Math.round(screen.getBoundingClientRect().width);range.setAttribute('aria-valuetext',w+' pixel di larghezza');$('[data-editorial-width]').value=w+' px nell’anteprima';});
};
const choosePanel=(panel,focus=false)=>{
mobilePanel=panel;app.dataset.mobilePanel=panel;
$$('[data-editorial-panel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.qPanel===panel)));
sizePreview();
if(focus){const target=panel==='preview'?preview:title;if(window.CiroKeyboard)window.CiroKeyboard.focus(target,true);else if(narrow.matches){target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});}}
};
const setView=which=>{view=which;renderReader();sizePreview();};
const select=(id,announce=true)=>{
selectedId=id;const d=entry().draft;title.value=d.title;category.value=d.category;text.value=d.text;photo.value='';
clearTitleError();fileError.hidden=true;photo.removeAttribute('aria-invalid');$('[data-editorial-photo-name]').textContent=d.cover==='custom'?'La tua foto è selezionata':'Nessuna foto scelta';renderList();renderState();renderReader();sizePreview();
if(announce)message('Articolo selezionato: “'+(d.title||'il nuovo articolo')+'”. Modifiche soltanto locali.');
};
const update=()=>{
const d=entry().draft;d.title=title.value;d.category=category.value;d.text=text.value;
if(title.value.trim())clearTitleError();renderState();renderList();renderReader();
};
title.addEventListener('input',update);text.addEventListener('input',update);category.addEventListener('change',update);
$$('[data-editorial-cover]').forEach(b=>b.addEventListener('click',()=>{uploadToken++;uploading=false;$('[data-editorial-publish]').disabled=false;entry().draft.cover=b.dataset.qCover;entry().draft.custom=null;photo.value='';$('[data-editorial-photo-name]').textContent='Nessuna foto scelta';fileError.hidden=true;photo.removeAttribute('aria-invalid');renderState();renderList();renderReader();message('Copertina “'+covers[b.dataset.qCover].label+'” applicata all’anteprima.');}));
$$('[data-editorial-view]').forEach(b=>b.addEventListener('click',()=>{setView(b.dataset.qView);message(view==='article'?'Vista articolo aperto.':'Vista elenco, con le modifiche in anteprima.');}));
$$('[data-editorial-device]').forEach(b=>b.addEventListener('click',()=>{device=b.dataset.qDevice;range.value=device==='wide'?'100':String(Math.max(45,Math.round(Math.min(320,pad.clientWidth)/Math.max(pad.clientWidth,1)*100)));sizePreview();}));
range.addEventListener('input',()=>{device='custom';sizePreview();});
$$('[data-editorial-panel]').forEach(b=>b.addEventListener('click',()=>choosePanel(b.dataset.qPanel)));
$('[data-editorial-preview]').addEventListener('click',()=>choosePanel('preview',true));
form.addEventListener('submit',event=>{
event.preventDefault();update();if(uploading){message('Aspetta che la foto sia pronta, poi riprova.');return;}
if(!title.value.trim()){titleError.textContent='Scrivi un titolo per questo articolo.';titleError.hidden=false;title.setAttribute('aria-invalid','true');choosePanel('edit');title.focus();message('Manca il titolo. Aggiungilo per continuare.',true);return;}
entry().draft.title=title.value.trim();title.value=entry().draft.title;entry().published=clone(entry().draft);
renderList();renderState();setView('list');state.textContent='Aggiornato nella prova';$('[data-editorial-preview-badge]').textContent='Quaderno aggiornato';
const item=$('[data-editorial-entry="'+selectedId+'"]');item?.classList.add('is-published-flash');setTimeout(()=>item?.classList.remove('is-published-flash'),1600);
message('“'+entry().published.title+'” compare nell’elenco dimostrativo. Il sito del cliente resta invariato.');choosePanel('preview',true);
});
$('[data-editorial-new]').addEventListener('click',()=>{
if(entries.length>=6){message('Limite della demo: sei articoli. Modifica quelli presenti oppure ricomincia.');return;}
entries.push({id:++counter,published:null,draft:{title:'',category:'Riflessioni',text:'',cover:'walk',custom:null}});view='article';select(counter,false);choosePanel('edit',true);title.focus();message('Nuovo articolo creato. Scrivi il titolo.');
});
$('[data-editorial-pick-photo]').addEventListener('click',()=>photo.click());
const readData=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('Non riesco a leggere questa foto.'));r.readAsDataURL(file);});
photo.addEventListener('change',async()=>{
const file=photo.files?.[0];if(!file)return;
const token=++uploadToken,id=selectedId;fileError.hidden=true;photo.removeAttribute('aria-invalid');
try{
if(file.size>5*1024*1024)throw new Error('Scegli una foto più piccola di 5 MB.');
const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
if(!jpeg&&!png&&!webp)throw new Error('Questo formato non è supportato. Scegli una foto JPG, PNG o WebP.');
uploading=true;$('[data-editorial-publish]').disabled=true;message('Preparo la tua foto, senza inviarla online…');
const data=await readData(file),im=new Image();im.src=data;await im.decode();
if(!im.naturalWidth||im.naturalWidth*im.naturalHeight>32000000)throw new Error('La foto è troppo grande. Scegli un’immagine con meno di 32 milioni di pixel.');
const ratio=Math.min(1,1200/Math.max(im.naturalWidth,im.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(im.naturalHeight*ratio));
const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Questo browser non riesce a preparare la foto. Prova una delle immagini disponibili.');
ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(im,0,0,canvas.width,canvas.height);
const result=canvas.toDataURL('image/jpeg',.86);const target=entries.find(e=>e.id===id);
if(token!==uploadToken||!target)return;target.draft.cover='custom';target.draft.custom=result;
if(id===selectedId)$('[data-editorial-photo-name]').textContent=file.name;
renderList();if(id===selectedId){renderState();renderReader();}message('Foto pronta nell’anteprima, conservata soltanto nella memoria della pagina.');
}catch(error){if(token!==uploadToken)return;fileError.textContent=error instanceof Error?error.message:'Non riesco a usare questa foto. Provane un’altra.';fileError.hidden=false;photo.setAttribute('aria-invalid','true');photo.value='';message(fileError.textContent,true);}
finally{if(token===uploadToken){uploading=false;$('[data-editorial-publish]').disabled=false;}}
});
const closeReset=()=>{resetCheck.hidden=true;$('[data-editorial-reset]').focus({preventScroll:true});};
const reset=announce=>{
uploadToken++;uploading=false;$('[data-editorial-publish]').disabled=false;entries=clone(defaults).map(e=>({...e,draft:clone(e.published)}));counter=2;selectedId=1;view='article';device='wide';range.value='100';resetCheck.hidden=true;select(1,false);choosePanel('edit');
message(announce?'Articoli iniziali ripristinati; modifiche locali eliminate.':'Editor dimostrativo: le modifiche restano in questa pagina.');
};
$('[data-editorial-reset]').addEventListener('click',()=>{resetCheck.hidden=false;$('[data-editorial-reset-confirm]').focus();});
$('[data-editorial-reset-cancel]').addEventListener('click',closeReset);
$('[data-editorial-reset-confirm]').addEventListener('click',()=>{reset(true);$('[data-editorial-reset]').focus({preventScroll:true});});
app.addEventListener('keydown',event=>{if(event.key==='Escape'&&!resetCheck.hidden){event.preventDefault();closeReset();}});
if('ResizeObserver'in window)new ResizeObserver(sizePreview).observe(pad);else addEventListener('resize',sizePreview,{passive:true});
narrow.addEventListener?.('change',()=>{choosePanel(mobilePanel);sizePreview();});

form.hidden=false;$$('[data-editorial-tools]').forEach(el=>el.hidden=false);$('[data-editorial-new]').hidden=false;$('[data-editorial-reset]').hidden=false;
app.classList.add('editorial-ready');reset(false);sizePreview();
})();
