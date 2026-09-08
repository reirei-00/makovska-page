/* Decorative ASCII studies, drawn locally. Each paper has its own composition. */
(() => {
  'use strict';
  const scene = document.querySelector('[data-ink-scene]');
  if (!scene) return;
  const art = scene.querySelector('[data-ink-art]'), button = scene.querySelector('[data-ink-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const initialTime = {garlic: reduced.matches ? 11 : 0, onion: reduced.matches ? 6 : 0, 'phd-proposal': reduced.matches ? 1.5 : 0};
  let playing = !reduced.matches, visible = true, time = initialTime[scene.dataset.inkScene] ?? 3.5, previous = null, lastDraw = -Infinity, frame = 0, cols = 70;
  const rows = 20, TAU = Math.PI * 2;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  try { if (sessionStorage.getItem('paper-ink-paused') === 'true') playing = false; } catch (_) { /* Optional preference. */ }

  function draw() {
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ char: ' ', tone: '' })));
    const cx = Math.floor(cols / 2), cy = 9;
    function put(x, y, char, tone = '') { x = Math.round(x); y = Math.round(y); if (grid[y]?.[x]) grid[y][x] = { char, tone }; }
    function word(x, y, text, tone = '') { [...text].forEach((char, i) => put(x + i, y, char, tone)); }
    function sprite(x, y, lines, tone = '') { lines.forEach((s, i) => [...s].forEach((c, j) => { if (c !== ' ') put(x + j, y + i, c, tone); })); }
    function line(a, b, tone = '', fraction = 1, dotted = false) {
      const dx = b[0] - a[0], dy = b[1] - a[1], steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
      const char = Math.abs(dx) > Math.abs(dy) * 2 ? '-' : Math.abs(dy) > Math.abs(dx) ? '|' : dx * dy > 0 ? '\\' : '/';
      for (let i = 0; i <= steps * clamp(fraction); i++) if (!dotted || i % 3 !== 1) put(a[0] + dx * i / steps, a[1] + dy * i / steps, char, tone);
    }
    function ellipse(x, y, rx, ry, tone = '', gap = 0, rotation = 0) {
      for (let i = 0; i < 180; i++) {
        const angle = i / 180 * TAU;
        if ((angle + rotation + TAU) % TAU < gap) continue;
        const dx = Math.cos(angle), dy = Math.sin(angle);
        put(x + rx * dx, y + ry * dy, Math.abs(dy) > .85 ? (dy < 0 ? '.' : '_') : Math.abs(dx) > .9 ? (dx > 0 ? ')' : '(') : dx * dy > 0 ? '\\' : '/', tone);
      }
    }
    function network() {
      const nodes = [[.09,8],[.29,3],[.35,13],[.57,7],[.68,16],[.90,4],[.91,13]].map(([x,y])=>[Math.round(x*(cols-1)),y]);
      const edges = [[0,1],[0,2],[1,3],[2,3],[2,4],[3,4],[3,5],[4,6],[5,6]], paths = [[0,1,3,5,6],[0,2,4,6]];
      edges.forEach(([a,b])=>line(nodes[a],nodes[b],'faint',1,true));
      const path=paths[Math.floor(time/9)%2], distance=clamp((time%9)/7)*(path.length-1);
      for(let i=0;i<path.length-1;i++) if(distance>i)line(nodes[path[i]],nodes[path[i+1]],'accent',distance-i);
      nodes.forEach(([x,y])=>word(x-1,y,'(o)'));
      const edge=Math.min(Math.floor(distance),path.length-2),part=clamp(distance-edge),a=nodes[path[edge]],b=nodes[path[edge+1]];
      put(a[0]+(b[0]-a[0])*part,a[1]+(b[1]-a[1])*part,'*','accent');
    }
    function narrative() {
      const phase=(time%12)/12, erasure=ease((phase-.18)/.4)*(1-ease((phase-.78)/.2));
      const threadY=(row,x)=>Math.round(4+row*5+Math.sin(x/cols*TAU+row+time*.17)*1.2);
      const links=[[0,.08,.12],[1,.12,.08],[0,.86,.92],[1,.92,.86]];
      if(cols>=55)links.push([0,.46,.52],[1,.52,.46]);
      const connectors=links.map(([row,from,to])=>{
        const x0=Math.round(from*(cols-1)),x1=Math.round(to*(cols-1));
        return [[x0,threadY(row,x0)],[x1,threadY(row+1,x1)]];
      });
      // Anchor each connector to the same moving curve used by its thread.
      connectors.forEach(([a,b])=>line(a,b));
      for(let row=0;row<3;row++){
        for(let x=2;x<cols-2;x++){
          const y=threadY(row,x);
          if(row!==1||hash(x,row)>.65*erasure)put(x,y,x%4===0?'.':'~',row===1?'accent':'faint');
        }
        const words=row===0?['story','story']:row===1?['memory','memory']:['trace','trace'];
        words.forEach((text,i)=>{
          const x=Math.round(cols*(i?.69:.22))-Math.floor(text.length/2),y=threadY(row,x);
          [...text].forEach((c,j)=>put(x+j,y,row===1&&hash(j+3,i) < erasure*.85?'.':c,row===1?'accent':''));
        });
      }
      connectors.forEach(([a,b])=>{put(...a,'+','accent');put(...b,'+','accent');});
    }
    function garlic() {
      const phase=time%20;
      // Open the bulb, cut one clove, then gather the pieces for the next loop.
      const opening=ease((phase-2)/3)*(1-ease((phase-16)/3));
      const cutting=ease((phase-7)/4)*(1-ease((phase-14)/2));
      const spread=Math.min(25,(cols-12)/2),shift=opening*spread;
      const clove=["     ,", "   .'|", "  /  |", " /   |", "(    |", "(    /", " \\  /", "  '-'"];
      const mirror=rows=>rows.map(row=>[...row.padEnd(7)].reverse().map(c=>({'/':'\\','\\':'/','(' : ')',')':'('}[c]||c)).join(''));
      const stage=phase<2||phase>=19?'bulb':phase<5||phase>=16?'opening':phase<7?'cloves':phase<11?'slicing':phase<14?'pieces':'gathering';
      scene.dataset.garlicStage=stage;
      scene.dataset.cloveSpread=opening.toFixed(3);
      const board=Math.min(cols-4,64),left=Math.floor((cols-board)/2);
      word(left,17,'.'+'-'.repeat(board-2)+'.','faint');
      word(left,18,"'"+'_'.repeat(board-2)+"'",'faint');
      if(opening<.04){
        sprite(cx-10,2,["           /", "          /|", "         / |", "      .-'  '-.", "    .'   /|   '.", "   /   .' | '.  \\", "  /   /   |   \\  \\", " (   (    |    )  )", " (   |    |    |  )", "  \\   \\   |   /  /", "   '.  '._|_.' .'", "     '-.____.-'", "        \\|/" ]);
        return;
      }
      if(opening<.7){
        const outer=["           /", "          /|", "         / |", "      .-'  '-.", "    .'        '.", "   /            \\", "  /              \\", " (                )", " (                )", "  \\              /", "   '.          .'", "     '-.____.-'", "        \\|/" ];
        sprite(cx-9,2,outer,opening>.1?'faint':'');
      }
      [-1,0,1].forEach(side=>{
        const x=cx+side*(4+shift*.72)-3;
        const y=side===0?6:7+Math.round(opening);
        if(side!==0||cutting===0){
          sprite(x,y,side>0?mirror(clove):clove,side===0?'accent':'');
        }else{
          // Three intact outline fragments visibly separate along two cut lines.
          clove.forEach((row,i)=>{
            const part=i<3?0:i<5?1:2;
            const dx=[-2,2,0][part]*cutting,dy=[-2,0,2][part]*cutting;
            word(Math.round(x+dx),Math.round(y+i+dy),row,'accent');
            if((i===2||i===4)&&cutting>.35)word(Math.round(x+dx)+2,Math.round(y+i+dy),"'--'",'accent');
          });
          if(cutting>.65){
            word(Math.round(x+2*cutting)+1,9,'.---.','accent');
            word(Math.round(x)+1,13,'.---.','accent');
          }
        }
      });
      if(phase>=6&&phase<11){
        // A slim kitchen blade makes two measured cuts across the central clove.
        const cut=Math.min(1,Math.floor((phase-6)/2.5));
        const stroke=ease(((phase-6)%2.5)/1.5);
        const y=Math.round(4+cut*2+stroke*4);
        word(cx-2,y,'________','faint');
        word(cx-3,y+1,'\\_______|===','');
      }
    }
    function onion() {
      const phase=time%22,clock=phase<14?phase:phase<16?14:14*(1-ease((phase-16)/6));
      const radius=Math.min(13,(cols-8)/3),stages=[];
      function curve(points,tone){
        for(let i=1;i<points.length;i++)line(points[i-1],points[i],tone);
      }
      [1,.74,.48].forEach((scale,i)=>{
        const rx=radius*scale,top=3+i*2,height=14-i*4;
        const peel=ease((clock-1-i*4)/3),settle=ease(clock-4-i*4);
        stages.push(peel);
        const drift=Math.min(cols/2-3-rx,radius+8-i*4)*settle;
        function shell(t,side){return [cx+side*rx*Math.pow(Math.sin(Math.PI*t),.8),top+height*t];}
        [-1,1].forEach(side=>{
          const hinge=shell(peel,side),points=[];
          for(let n=0;n<=42;n++){
            const t=n/42;
            let point=shell(t,side);
            if(peel>0&&t<peel){
              // The free skin curls away from its advancing attachment point.
              const u=(peel-t)/peel;
              point=[hinge[0]+side*rx*(.45+.55*peel)*Math.sin(u*Math.PI*.78),hinge[1]-3.6*peel*Math.sin(u*Math.PI)+1.2*peel*u];
            }
            points.push([point[0]+side*drift,point[1]-settle*2]);
          }
          curve(points,peel>0&&peel<1?'accent':settle>0?'faint':i===1?'accent':'');
        });
      });
      const exposed=stages.filter(p=>p===1).length;
      scene.dataset.peeledLayers=String(exposed);
      scene.dataset.peelProgress=stages.map(p=>p.toFixed(3)).join(',');
      word(cx-1,10,'(@)');
      if(stages[0]<.4)sprite(cx-1,0,['\\|/',' | ',' | '],'faint');
      if(exposed===3)sprite(cx-2,8,[' .-. ','(   )','(   )'," '-' "]);
    }
    function undone() {
      const width=Math.min(cols-6,78),start=Math.floor((cols-width)/2);
      const step=width<45?5:6,count=Math.floor((width-1)/step),span=count*step;
      const offset=start+Math.floor((width-span)/2);
      const sites=width<45?[[.3,7,0],[.73,11,2.8]]:[[.22,7,0],[.53,11,2.3],[.82,7,4.6]];
      function gaps(at){
        return sites.map(([x,y,phase])=>{
          const pulse=.25+.75*(1+Math.sin(at*.28+phase))/2;
          return {x:x*span+Math.sin(at*.1+phase)*span*.045,y:y+Math.sin(at*.13+phase)*.8,rx:Math.min(span*.25,12)*pulse,ry:4.5*pulse};
        });
      }
      const now=gaps(time),before=gaps(time-2);
      function distance(x,y,holes){return Math.min(...holes.map(h=>Math.hypot((x-h.x)/h.rx,(y-h.y)/h.ry)));}
      function trace(x,y,char,tone=''){
        const d=distance(x,y,now);
        // Keep the surviving traces fixed while coherent holes open in the fabric.
        if(d<.78)return;
        if(d<1.18){
          const clarity=ease((d-.78)/.4);
          if(hash(x,y)>clarity)return;
          if(clarity<.7){char='.';tone='faint';}
        }else if(distance(x,y,before)<1.18){
          // A short plum afterimage marks a trace that has just become visible again.
          tone='accent';
        }
        put(offset+x,y,char,tone);
      }
      for(let row=0;row<5;row++){
        const y=3+row*3;
        for(let x=0;x<=span;x++)trace(x,y,x%step===0?'o':'-',x%step===0?'':'faint');
        if(row===4)continue;
        for(let node=0;node<=count;node++){
          if((node+row)%3===1)continue;
          for(let dy=1;dy<3;dy++)trace(node*step,y+dy,'|','faint');
        }
      }
    }
    function lapa() {
      // Ukrainian letters belong to the motif; the paw itself uses ASCII marks.
      const pads=[[-10,4,'І'],[-4,1,'Ґ'],[4,1,'Є'],[10,4,'Ї']];
      const beat=(time%12)/3,active=Math.floor(beat)%4;
      const words=['мова','слово','думка','знання'];
      const leftEdge=cx-15,rightEdge=cx+15;
      if(cols>=65){
        for(let i=0;i<3;i++){
          const y=5+i*5,shift=Math.sin(time*.27+i)*.7;
          for(let x=2;x<leftEdge-2;x++)if(x%3!==0)put(x,y+Math.sin(x*.12+i)*.65+shift,'.','faint');
          for(let x=rightEdge+2;x<cols-2;x++)if(x%3!==0)put(x,y+Math.sin(x*.12+i)*.65+shift,'.','faint');
          const phase=(time*.07+i/3)%1;
          const label=words[(i+Math.floor(time/12))%words.length];
          const leftX=2+Math.round(phase*Math.max(0,leftEdge-label.length-6));
          const rightX=rightEdge+3+Math.round(phase*Math.max(0,cols-rightEdge-label.length-6));
          word(leftX,y+Math.round(shift),label,i===active%3?'accent':'');
          word(rightX,y+Math.round(shift),label,i===active%3?'accent':'');
        }
      }else{
        // At phone widths, give the paw room and let a short word travel below it.
        word(cx-Math.floor(words[active].length/2),19,words[active],'accent');
      }
      pads.forEach(([x,y,letter],i)=>{
        const lift=i===active&&beat%1<.38?-1:0;
        sprite(cx+x-2,y+lift,[' .-. ',`( ${letter} )`," '-' "],i===active?'accent':'');
      });
      sprite(cx-11,8,[
        '        .---.        ',
        "      .'     '.      ",
        "    .'         '.    ",
        '   /             \\   ',
        '  /               \\  ',
        ' (                 ) ',
        '  \\               /  ',
        "   '._   ___   _.'   ",
        "      '-'   '-'      "
      ]);
      word(cx-4,13,'LAPA LLM','accent');
      const pulse=beat%1;
      if(pulse<.65){
        const [x,y]=pads[active],from=[cx+x,y+3],to=[cx+(x<0?-3:3),9];
        const t=pulse/.65;
        put(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t,'.','accent');
      }
    }
    function book() {
      const words=['мова','досвід','знання'];
      // Illustrative embeddings, used only in this decorative word-to-vector flow.
      const vectors=['[+0.24 -0.18 +0.73]','[-0.36 +0.82 +0.15]','[+0.61 +0.09 -0.42]'];
      const phase=(time%9)/9,active=Math.floor(time/9)%3,wide=cols>=82;
      const left=cx-12,right=cx+12,top=5;
      const stage=phase<.4?'input':phase<.6?'book':'output';
      scene.dataset.embeddingStage=stage;
      function vector(i,x,y){
        const value=vectors[i];
        word(x,y,value,'faint');
        if(i===active&&stage==='output')word(x,y,value.slice(0,Math.ceil(ease((phase-.6)/.3)*value.length)),'accent');
      }
      if(wide){
        words.forEach((text,i)=>{
          const y=6+i*3;
          word(2,y,text,i===active?'accent':'');
          line([11,y],[left-3,y],'faint');put(left-2,y,'>','faint');
          line([right+2,y],[right+6,y],'faint');put(right+7,y,'>','faint');
          vector(i,right+10,y);
        });
        if(stage==='input'){
          const x=11+ease(phase/.4)*(left-9);
          [...words[active]].forEach((char,i)=>{if(Math.round(x+i)<left)put(x+i,6+active*3,char,'accent');});
        }
        if(stage==='output')put(right+2+ease((phase-.6)/.4)*5,6+active*3,'>','accent');
      }else{
        const positions=[cx-11,cx-4,cx+5];
        words.forEach((text,i)=>word(positions[i],0,text,i===active?'accent':''));
        line([cx,1],[cx,3],'faint');put(cx,4,'v','faint');
        line([cx,14],[cx,15],'faint');put(cx,16,'v','faint');
        if(stage==='input'){
          const y=1+Math.floor(ease(phase/.4)*4);
          if(y<5)word(cx-Math.floor(words[active].length/2),y,words[active],'accent');
        }
        if(stage==='output')put(cx,14+Math.round(ease((phase-.6)/.4)*2),'v','accent');
        vector(active,cx-9,18);
      }
      // Two curved pages and a clear spine keep the book readable at phone widths.
      sprite(left,top,[
        ' .--------.   .--------. ',
        '/          \\ /          \\',
        '|           |           |',
        '|           |           |',
        '|           |           |',
        '|           |           |',
        '|           |           |',
        "'----------.|.----------'",
        ' \\_________|||_________/ '
      ]);
      for(let row=0;row<3;row++){
        word(left+3,top+2+row*2,row===1?'--- --':'-- ---','faint');
        word(cx+3,top+2+row*2,row===1?'-- ---':'--- --','faint');
      }
      if(stage==='book'){
        const progress=(phase-.4)/.2;
        word(left+3,top+4,words[active],progress<.5?'accent':'faint');
        if(progress>.35)word(cx+3,top+4,'0 1 0','accent');
      }
    }
    function edits() {
      for(let y=4;y<16;y+=3)for(let x=2;x<cols-3;x++)if(x%13!==0)put(x,y,x%5===0?':':'-','faint');
      const rx=Math.min(7,cols*.18),x=rx+2+(Math.sin(time*.28)+1)/2*(cols-rx*2-9);
      ellipse(x,9,rx,5,'accent');line([x+rx*.7,13],[x+rx+5,18],'accent');
      for(let y=6;y<13;y+=3)word(x-3,y,'...','accent');
    }
    function forgetting() {
      // A Turing-machine-inspired vignette: read one cell, erase *, advance.
      const cycle=Math.floor(time/3),phase=time%3;
      const moving=phase>=2.2,writing=phase>=1&&phase<2.2;
      const spacing=cols<65?4:6;
      let count=Math.min(13,Math.floor((cols-6)/spacing));
      if(count%2===0)count--;
      const radius=(count-1)/2,left=cx-count*spacing/2,right=cx+count*spacing/2;
      const shift=ease((phase-2.2)/.8)*spacing;
      const symbols=['*','1','0','*','0','1','1','*'];
      const symbolAt=index=>symbols[((index%symbols.length)+symbols.length)%symbols.length];
      const current=symbolAt(cycle),state=moving?'q2':writing?'q1':'q0';
      const erased=current==='*'&&phase>=1.25;
      const reelOffset=Math.min(24,Math.floor(cols/2)-5),rotation=(cycle+shift/spacing)*.7;
      function reel(x,direction){
        sprite(x-4,4,["  .---.  "," /     \\ ","(   o   )"," \\     / ","  '---'  "]);
        for(let n=0;n<3;n++){
          const angle=rotation*direction+n*TAU/3,dx=Math.cos(angle),dy=Math.sin(angle);
          put(x+dx*2,6+dy,Math.abs(dy)<.35?'-':dx*dy>0?'\\':'/','faint');
        }
        put(x,6,'o','accent');
      }
      reel(cx-reelOffset,1);reel(cx+reelOffset,-1);
      line([cx-reelOffset-4,6],[left,11],'faint');
      line([cx+reelOffset+4,6],[right,11],'faint');
      // Explicit control state and a visible write rule make the reference legible.
      sprite(cx-6,1,['.-----------.','|           |','|           |',"'-----+-----'"]);
      word(cx-1,2,state,'accent');
      word(cx-3,3,current+' -> '+(current==='*'?'_':current),writing?'accent':'');
      line([cx,5],[cx,7],'accent');
      sprite(cx-2,8,['+---+','| | |','  v  '],moving?'faint':'accent');
      function tapePut(x,y,char,tone=''){
        x=Math.round(x);if(x>=left&&x<=right)put(x,y,char,tone);
      }
      for(let x=left;x<=right;x++){
        tapePut(x,11,'-','faint');tapePut(x,15,'-','faint');
      }
      for(let i=-radius-1;i<=radius+1;i++){
        const x=cx+i*spacing+shift,boundary=x-spacing/2;
        const original=symbolAt(cycle-i),targeted=original==='*';
        const removed=targeted&&(i>0||(i===0&&erased));
        let glyph=removed?' ':original;
        if(i===0&&targeted&&writing&&!erased)glyph='.';
        const tone=i===0&&!moving?'accent':targeted&&!removed?'accent':'';
        tapePut(boundary,11,'+','faint');tapePut(boundary,15,'+','faint');
        for(let y=12;y<15;y++)tapePut(boundary,y,'|','faint');
        if(Math.round(x)>left&&Math.round(x)<right)tapePut(x,13,glyph,tone);
      }
      word(left-3,13,'...','faint');word(right+1,13,'...','faint');
      // The inspected cell stays under a fixed head; the ribbon steps one cell.
      if(!moving){
        for(let y=12;y<15;y++){
          tapePut(cx-spacing/2,y,'|','accent');tapePut(cx+spacing/2,y,'|','accent');
        }
      }
      word(cx-5,18,'---------->','faint');
      if(moving)put(cx-5+Math.round(shift/spacing*9),18,'>','accent');
      scene.dataset.memoryStage=moving?'advance':writing?(current==='*'?'erase':'retain'):'read';
      scene.dataset.memorySymbol=current;
      scene.dataset.memoryErased=String(erased);
    }
    function followNarrative() {
      const left=2,mid=Math.floor(cols*.4),right=cols-5;
      for(let row=0;row<3;row++){
        const y=3+row*5;
        word(left,y,'+-----+');word(left,y+1,'| ... |');word(left,y+2,'+-----+');
        const target=[right,4+row*5],joint=[mid,10];
        line([left+7,y+1],joint,'faint',1,true);line(joint,target,'faint',1,true);word(target[0]-1,target[1],'(o)');
      }
      const phase=(time%9)/9,route=Math.floor(time/9)%3,from=[left+7,4+route*5],joint=[mid,10],to=[right,4+((route+1)%3)*5];
      const a=phase<.5?from:joint,b=phase<.5?joint:to,t=(phase*2)%1;
      line(from,joint,'accent',Math.min(1,phase*2));if(phase>.5)line(joint,to,'accent',t);
      put(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'*','accent');
    }
    const scenes={'lens':narrative,'telegram-narratives':network,'ukrainian-llms':lapa,'garlic':garlic,'nlp-education':book,'memory-undone':undone,'onion':onion,'vandalism-propaganda':edits,'phd-proposal':forgetting,'masters-thesis':followNarrative};
    scenes[scene.dataset.inkScene]();
    const fragment=document.createDocumentFragment();
    grid.forEach((row,index)=>{
      let text='',tone=row[0].tone;
      function flush(){if(!text)return;if(!tone)fragment.appendChild(document.createTextNode(text));else{const span=document.createElement('span');span.className=`paper-ink-${tone}`;span.textContent=text;fragment.appendChild(span);}text='';}
      row.forEach(cell=>{if(cell.tone!==tone){flush();tone=cell.tone;}text+=cell.char;});flush();if(index<rows-1)fragment.appendChild(document.createTextNode('\n'));
    });
    art.replaceChildren(fragment);
  }
  function measure(){const size=parseFloat(getComputedStyle(art).fontSize);cols=Math.max(28,Math.min(112,Math.floor(art.clientWidth/(size*.61))-1));draw();}
  function tick(now){frame=0;if(!playing||!visible||document.hidden||!scene.isConnected)return;if(previous!==null)time+=Math.min((now-previous)/1000,.15);previous=now;if(now-lastDraw>120){draw();lastDraw=now;}frame=requestAnimationFrame(tick);}
  function sync(){cancelAnimationFrame(frame);frame=0;previous=null;lastDraw=-Infinity;scene.querySelector('[data-ink-pause]').hidden=!playing;scene.querySelector('[data-ink-play]').hidden=playing;if(playing&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  button.addEventListener('click',()=>{playing=!playing;try{sessionStorage.setItem('paper-ink-paused',String(!playing));}catch(_){}sync();});
  reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;sync();}});
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(scene);
  new ResizeObserver(measure).observe(art);document.fonts.ready.then(measure);
  button.hidden=false;measure();sync();
})();
