export function PageHeader({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:React.ReactNode}){
return <header className="page-header"><div>{eyebrow&&<div className="kicker">{eyebrow}</div>}<h1>{title}</h1>{description&&<p>{description}</p>}</div>{action&&<div className="page-action">{action}</div>}</header>;}
