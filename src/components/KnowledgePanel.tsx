import { KNOWLEDGE } from '../data/catalog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function KnowledgePanel() {
  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 leading-relaxed">
        《设施园艺学》结构与环境调控核心概念速查。建议在挑战前先阅读对应卡片。
      </div>
      <Accordion type="multiple" className="w-full">
        {KNOWLEDGE.map((k, i) => (
          <AccordionItem key={k.id} value={k.id}>
            <AccordionTrigger className="text-xs font-bold text-left">
              <span><span className="text-emerald-600 mr-1.5">{String(i + 1).padStart(2, '0')}</span>{k.title}</span>
            </AccordionTrigger>
            <AccordionContent>
              {k.formula && (
                <div className="rounded bg-slate-100 border border-slate-200 px-2 py-1.5 mb-2 font-mono text-[11px] text-emerald-800">{k.formula}</div>
              )}
              <p className="text-xs text-slate-600 leading-relaxed">{k.body}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
