import React from 'react';
import {Info,ChevronDown} from 'lucide-react';

export default function FunctionGuide({title='Erste Schritte',intro,items=[]}){
 return <section className="function-guide" aria-label={title}>
  <div className="function-guide-heading"><span className="function-guide-icon"><Info size={18}/></span><div><span className="function-guide-kicker">HILFE & ORIENTIERUNG</span><h2>{title}</h2><p>{intro}</p></div></div>
  <div className="function-guide-list">
   {items.map((item,index)=><details className="function-guide-item" key={item.title}>
    <summary><span className="function-guide-number">{String(index+1).padStart(2,'0')}</span><span className="function-guide-label">{item.title}<small>{item.short}</small></span><ChevronDown size={17}/></summary>
    <div className="function-guide-content"><p>{item.description}</p>{item.steps?.length>0&&<><strong>So gehst du vor:</strong><ol>{item.steps.map((step,i)=><li key={i}>{step}</li>)}</ol></>}{item.purpose&&<p className="function-guide-purpose"><strong>Wozu dient das?</strong> {item.purpose}</p>}{item.note&&<p className="function-guide-note">{item.note}</p>}</div>
   </details>)}
  </div>
 </section>;
}
