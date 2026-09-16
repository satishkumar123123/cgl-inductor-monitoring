import { jsPDF } from 'jspdf';
import { monthlyProductionTrends, monthlyBottomDrossTrends } from './productionTrends.js';

const productionMetrics = [
  ['production', 'Production', 'MT', '#2563eb'], ['metal', 'Metal Charged', 'MT', '#7c3aed'],
  ['dross', 'Total Dross', 'MT', '#ea580c'], ['drossPercent', 'Dross Percentage', '%', '#e11d48'],
  ['drossKgMT', 'Dross per Production', 'kg/MT', '#059669'],
];
const valid = (n) => typeof n === 'number' && Number.isFinite(n);
const fmt = (n) => valid(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-';
// Charts and tables are drawn as PDF vectors, independent of the screen width.
export function buildProductionPdf({ history, endMonth, months = 6, bottomDross = false, generatedAt = new Date() }) {
  if (![6, 12].includes(months)) throw new Error('Select 6 or 12 months.');
  const data = (bottomDross ? monthlyBottomDrossTrends : monthlyProductionTrends)(history, endMonth, months);
  const metrics = bottomDross ? [['bottomDross', 'Bottom Dross Quantity', 'MT', '#9333ea']] : productionMetrics;
  if (!data.some((r) => metrics.some(([key]) => valid(r[key])))) throw new Error('No saved data in this period.');
  const title = bottomDross ? 'Bottom Dross Report' : 'Production & Dross Report';
  const range = `${data[0].month} to ${endMonth}`;
  const stamp = generatedAt.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title, subject: range, author: 'CGL Monitoring' });
  const text = (value, x, y, size = 10, color = '#172554', bold = false, options = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(size); pdf.setTextColor(color);
    pdf.text(Array.isArray(value) ? value : String(value), x, y, options);
  };
  const box = (x,y,w,h,color,r=3) => { pdf.setFillColor(color);pdf.roundedRect(x,y,w,h,r,r,'F'); };
  const header = (section) => {
    box(0,0,297,210,'#f4f7fc',0);box(0,0,297,35,'#172554',0);box(0,35,297,2,bottomDross?'#a855f7':'#06b6d4',0);
    text('CGL / OPERATIONS INTELLIGENCE',14,11,9,'#a5b4fc',true);text(title,14,25,20,'#ffffff',true);
    text(section,283,12,9,'#ffffff',true,{align:'right'});text(`${months} MONTHS | ${range}`,283,25,9,'#cbd5e1',false,{align:'right'});
  };
  const page = (section) => { pdf.addPage();header(section); };
  header('PERIOD SUMMARY');
  text('Monthly performance at a glance',14,50,19,'#172554',true);
  text(`Generated ${stamp} | Saved records only`,14,59,9,'#64748b');
  metrics.forEach(([key,label,unit,color],i)=> {
    const values=data.map(r=>r[key]).filter(valid),sum=values.reduce((a,b)=>a+b,0);
    let value=values.length?sum:null, caption='Period total';
    if(key==='drossPercent'||key==='drossKgMT') {
      const denominator=key==='drossPercent'?'metal':'production';
      const paired=data.filter(r=>valid(r.dross)&&valid(r[denominator])&&r[denominator]>0);
      const den=paired.reduce((a,r)=>a+r[denominator],0);
      value=den?paired.reduce((a,r)=>a+r.dross,0)/den*(key==='drossPercent'?100:1000):null;
      caption='Weighted ratio (eligible months)';
    }
    const x=14+(i%3)*91,y=70+Math.floor(i/3)*48;
    box(x,y,87,43,'#ffffff');box(x,y,87,2,color,0);text(label,x+5,y+10,11,color,true);
    text(`${fmt(value)} ${unit}`,x+5,y+23,20,'#172554',true);text(caption,x+5,y+31,8,'#64748b');
    text(`${values.length} / ${months} months with valid values`,x+5,y+38,8,'#64748b');
  });
  if (bottomDross) {
    const values = data.map(r => r.bottomDross).filter(valid);
    const logs = history.flatMap(r => r.bottomDrossLogs || []).filter(r => r.date?.slice(0,7) >= data[0].month && r.date?.slice(0,7) <= endMonth);
    [['Removal entries', logs.length, 'Saved logs in the selected period'], ['Monthly average (MT)', values.reduce((a,b) => a+b,0)/values.length, 'Average across months with logs']].forEach(([label,value,caption],i) => {
      const x = 105+i*91; box(x,70,87,43,'#ffffff');box(x,70,87,2,i?'#059669':'#2563eb',0);
      text(label,x+5,80,11,i?'#059669':'#2563eb',true);text(fmt(value),x+5,93,20,'#172554',true);text(caption,x+5,105,8,'#64748b');
    });
  }
  text(bottomDross ? ['Monthly quantities are summed from the dated removal logs.', 'Months without logs remain blank. Monthly averages exclude these missing months.', 'Detailed logs and line remarks for the selected period follow the monthly register.'] : ['Missing months are blank, not zero. Actual recorded zeros are retained.', 'Ratios require positive denominators. Weighted summaries use months with both numerator and denominator.', 'Bar charts compare monthly quantities; line charts show their progression over the same period.'],14,178,9,'#64748b',false,{lineHeightFactor:1.5});
  function chart(metric,type,y) {
    const [key,label,unit,color]=metric, values=data.map(r=>r[key]).filter(valid);
    box(14,y,269,68,'#ffffff');text(`${label} (${unit}) | ${type==='bar'?'BAR COMPARISON':'LINE TREND'}`,19,y+9,11,color,true);
    if(!values.length){text('No valid measurements in this period.',20,y+35,11,'#64748b');return;}
    const lo=Math.min(0,...values),hi=Math.max(0,...values),span=hi-lo||1;
    const min=lo<0?lo-span*.1:0,max=hi>0?hi+span*.18:1;
    const left=37,width=238,top=y+19,height=30,step=width/data.length,py=v=>top+height-(v-min)/(max-min)*height;
    for(let i=0;i<5;i++){const v=min+(max-min)*i/4,yy=py(v);pdf.setDrawColor('#e2e8f0');pdf.setLineWidth(.15);pdf.line(left,yy,left+width,yy);text(Math.abs(v)>10000?`${(v/1000).toFixed(1)}k`:fmt(v),left-3,yy+1,7,'#64748b',false,{align:'right'});}
    let previous=null;
    data.forEach((r,i)=>{const x=left+step*(i+.5),v=r[key];
      if(valid(v)){
        const yy=py(v);pdf.setFillColor(color);pdf.setDrawColor(color);
        if(type==='bar'){const zero=py(0);pdf.rect(x-4,v>=0?yy:zero,8,Math.max(.2,Math.abs(zero-yy)),'F');}
        else {if(previous){pdf.setLineWidth(.8);pdf.line(previous.x,previous.y,x,yy);}pdf.circle(x,yy,1.1,'F');previous={x,y:yy};}
        text(fmt(v),x,yy-2,7,color,true,{align:'center'});
      }else {previous=null;text('-',x,py(0)-2,8,'#64748b',false,{align:'center'});}
      text(r.label,x,y+59,8,'#475569',false,{align:'center'});
    });
  }
  for(const metric of metrics){page('MONTHLY CHARTS');chart(metric,'bar',46);chart(metric,'line',120);}
  page('MONTHLY REGISTER');
  text('Complete monthly readings',14,50,18,'#172554',true);
  const col=269/(metrics.length+1);
  ['Month',...metrics.map(m=>`${m[1]} (${m[2]})`)].forEach((v,i)=>{box(14+i*col,60,col,13,i?metrics[i-1][3]:'#172554',0);text(v,14+i*col+col/2,68,8,'#ffffff',true,{align:'center'});});
  data.forEach((r,i)=>{const y=73+i*8;box(14,y,269,8,i%2?'#eef2ff':'#ffffff',0);[r.month,...metrics.map(m=>fmt(r[m[0]]))].forEach((v,c)=>text(v,14+c*col+col/2,y+5.3,9,'#172554',c===0,{align:'center'}));});
  text('"-" means missing or undefined, not zero. Values rounded to two decimal places.',14,180,9,'#64748b');
  if(bottomDross){
    const logs=history.flatMap(r=>r.bottomDrossLogs||[]).filter(r=>r.date?.slice(0,7)>=data[0].month&&r.date?.slice(0,7)<=endMonth).sort((a,b)=>a.date.localeCompare(b.date));
    let y=0;
    const logPage=()=>{page('REMOVAL LOGS');text('Dated bottom dross removal log',14,49,17,'#172554',true);box(14,57,269,11,'#7e22ce',0);text('Date',19,64,9,'#ffffff',true);text('Quantity (MT)',56,64,9,'#ffffff',true);text('Line remarks / status',93,64,9,'#ffffff',true);y=73;};
    logPage();
    if(!logs.length)text('No removal logs in the selected period.',19,y+7,10,'#64748b');
    for(const log of logs){
      // Plain ASCII protects standard PDF font rendering for unexpected Unicode notes.
      pdf.setFont('helvetica','normal');pdf.setFontSize(9);
      const note=String(log.lineRemarks||'-').replace(/[^\x20-\x7E\n]/g,'?');
      let lines=pdf.splitTextToSize(note,180);
      while(lines.length){
        if(y>179)logPage();
        const capacity=Math.max(1,Math.floor((184-y-6)/4.5));const part=lines.splice(0,capacity),height=Math.max(10,part.length*4.5+5);
        box(14,y,269,height,'#ffffff',0);text(log.date,19,y+5,9);const qty=log.quantityMT===null||log.quantityMT===undefined||String(log.quantityMT).trim()===''?null:Number(log.quantityMT);text(fmt(qty),57,y+5,9);text(part,93,y+5,9,'#475569',false,{lineHeightFactor:1.42});y+=height+2;
        if(lines.length)logPage();
      }
    }
  }
  for(let i=1;i<=pdf.getNumberOfPages();i++){pdf.setPage(i);pdf.setDrawColor('#cbd5e1');pdf.line(14,197,283,197);text(`CGL | ${range} | Generated ${stamp}`,14,204,7,'#64748b');text(`${i} / ${pdf.getNumberOfPages()}`,283,204,8,'#172554',true,{align:'right'});}
  return pdf;
}
export function downloadProductionPdf(options){buildProductionPdf(options).save(`CGL_${options.bottomDross?'Bottom_Dross':'Production'}_${options.endMonth}_${options.months}months.pdf`);}
