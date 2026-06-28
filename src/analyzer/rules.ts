import type { DocumentKind, RiskFinding, Severity } from "../types";
import { findEvidence, includesAny } from "./patterns";

interface RuleDefinition {
  id: string;
  kinds: DocumentKind[];
  terms: string[];
  title: string;
  severity: Severity;
  explanation: string;
  whyItMatters: string;
  suggestion: string;
  modification: string;
  checklistQuestion: string;
}

export const ruleDefinitions: RuleDefinition[] = [
  {
    id: "rental-large-early-exit-penalty",
    kinds: ["rental", "unknown"],
    terms: ["提前退租", "两个月租金", "违约金"],
    title: "提前退租成本可能偏高",
    severity: "red",
    explanation: "合同把提前退租和较高违约金绑定，可能让你在工作变动、家庭变化时承担较大退出成本。",
    whyItMatters: "租房合同最常见的争议之一是提前退租。违约金、通知期和押金扣除如果叠加，实际损失会明显高于预期。",
    suggestion: "签署前确认是否能把违约金上限、通知期和押金扣除规则写得更明确。",
    modification: "建议改为：乙方提前退租的，应提前 30 日书面通知甲方；甲方可要求乙方承担实际空置损失，但最高不超过一个月租金。押金扣除、违约金和实际损失不得重复计算。",
    checklistQuestion: "如果我提前退租，最多会损失多少钱？通知期和违约金能否二选一或设置上限？"
  },
  {
    id: "rental-broad-deposit-deduction",
    kinds: ["rental", "unknown"],
    terms: ["押金", "直接扣除", "甲方认为必要"],
    title: "押金扣除口径过宽",
    severity: "red",
    explanation: "合同允许出租方按较宽口径扣押金，但没有列出清晰的验收标准、凭证要求或争议处理方式。",
    whyItMatters: "押金是租房纠纷高发点。扣除条件越模糊，退租时越容易出现单方定价和举证困难。",
    suggestion: "要求写明扣款项目、凭证、维修报价确认方式，以及押金退还期限。",
    modification: "建议改为：甲方扣除押金仅限于未付租金、水电燃气等已发生费用、经双方确认的人为损坏维修费用。甲方应提供发票、报价单或双方确认记录，并在退租交接后 7 日内退还剩余押金。",
    checklistQuestion: "扣押金必须提供维修发票或双方确认的报价吗？押金最晚哪一天退？"
  },
  {
    id: "rental-tenant-pays-all-repairs",
    kinds: ["rental", "unknown"],
    terms: ["所有设施设备损坏均由乙方负责", "先行垫付维修费用", "自然老化"],
    title: "维修责任可能过度转嫁给承租人",
    severity: "yellow",
    explanation: "合同可能把自然老化、主体结构或非人为损坏也先交给承租人承担。",
    whyItMatters: "房屋自然老化和人为损坏应该区分，否则大额维修费用可能落到承租人身上。",
    suggestion: "补充区分人为损坏、自然损耗、房屋主体结构和电器老化的责任边界。",
    modification: "建议改为：因乙方人为使用不当造成的损坏由乙方承担；因房屋主体结构、自然老化、设备正常寿命到期或非乙方原因造成的损坏由甲方承担。紧急维修需乙方垫付的，甲方应在收到凭证后 7 日内返还。",
    checklistQuestion: "哪些维修由房东承担？自然老化、电器寿命到期、下水堵塞分别怎么算？"
  },
  {
    id: "employment-non-compete-vague-compensation",
    kinds: ["employment", "unknown"],
    terms: ["竞业限制", "离职后两年", "补偿金标准由甲方另行制定"],
    title: "竞业限制补偿和范围不清晰",
    severity: "red",
    explanation: "协议限制离职后的就业选择，但补偿标准、竞争范围和适用岗位没有同步写清楚。",
    whyItMatters: "竞业限制会影响离职后的职业选择。没有明确补偿和范围时，员工很难判断真实成本。",
    suggestion: "要求明确竞业限制地区、公司范围、岗位范围、补偿金额、支付周期和解除条件。",
    modification: "建议改为：竞业限制仅适用于双方书面列明的竞争公司、地区和岗位；限制期限不超过约定期限，并按月支付明确补偿金。公司未按期支付补偿或书面解除竞业限制的，员工不再受该限制约束。",
    checklistQuestion: "竞业限制补偿每月多少钱？覆盖哪些公司和岗位？公司可以单方面解除吗？"
  },
  {
    id: "employment-long-notice",
    kinds: ["employment", "unknown"],
    terms: ["提前 90 日", "提前90日", "书面通知"],
    title: "离职通知期较长",
    severity: "yellow",
    explanation: "协议要求较长离职通知期，可能影响你接受新机会或安排交接。",
    whyItMatters: "过长通知期会降低求职和跳槽灵活性，也可能和劳动法规实践存在冲突。",
    suggestion: "确认通知期是否符合当地规则，以及是否能按法定标准调整。",
    modification: "建议改为：员工离职通知期按适用法律法规执行；如双方需要延长交接时间，应另行书面协商，且不得限制员工依法解除劳动关系。",
    checklistQuestion: "离职通知期为什么是 90 天？能否改为当地法规认可的标准期限？"
  },
  {
    id: "employment-high-liquidated-damages",
    kinds: ["employment", "unknown"],
    terms: ["违约金", "200000", "赔偿"],
    title: "违约金金额较高",
    severity: "red",
    explanation: "协议设置了较高违约金，并可能要求继续赔偿额外损失。",
    whyItMatters: "高额违约金会放大普通沟通、资料使用或离职争议的后果。",
    suggestion: "要求明确触发条件、上限、损失证明方式和哪些行为不构成违约。",
    modification: "建议改为：违约责任仅在一方存在明确违约行为并造成实际损失时适用；赔偿金额以实际、可证明损失为限。任何固定违约金应设置合理上限，并明确不适用于正常离职、依法维权或经授权使用资料的情形。",
    checklistQuestion: "哪些具体行为会触发违约金？是否必须证明实际损失？违约金能否设置合理上限？"
  },
  {
    id: "renovation-front-loaded-payment",
    kinds: ["renovation", "unknown"],
    terms: ["支付总价 60%", "首期款", "签约当日"],
    title: "首付款比例偏高",
    severity: "red",
    explanation: "装修合同在施工成果出现前要求支付较大比例款项，业主后续议价和纠错空间会变小。",
    whyItMatters: "装修纠纷常发生在进度、质量和增项。付款过早会削弱业主对质量和节点的控制。",
    suggestion: "把付款拆到材料进场、水电验收、泥木验收、竣工验收等可验证节点。",
    modification: "建议改为：工程款按可验收节点分期支付，例如签约定金、材料进场、水电验收、泥木验收、竣工验收和质保期满。每期付款以双方书面确认的验收记录为前提，首期款比例不宜过高。",
    checklistQuestion: "能否把首付款降低，并把付款绑定到双方签字确认的验收节点？"
  },
  {
    id: "renovation-open-ended-change-orders",
    kinds: ["renovation", "unknown"],
    terms: ["先行施工", "结算时计入总价", "增项"],
    title: "增项可能先施工后收费",
    severity: "red",
    explanation: "合同允许承包方先做增项再结算，业主可能在不清楚价格时被动接受费用。",
    whyItMatters: "装修增项是预算失控的主要来源。没有书面确认和单价清单，最终价很难控制。",
    suggestion: "要求任何增项必须先报价、书面确认、再施工。",
    modification: "建议改为：任何增项、减项或材料变更必须先由承包方提交书面报价和工期影响说明，经业主书面确认后方可施工。未经书面确认的增项，业主有权拒绝支付。",
    checklistQuestion: "所有增项是否必须先给报价单并经我书面确认？未确认增项是否可以拒付？"
  },
  {
    id: "renovation-acceptance-deemed-pass",
    kinds: ["renovation", "unknown"],
    terms: ["即视为验收合格", "内部验收标准", "支付尾款"],
    title: "验收合格条件偏向承包方",
    severity: "yellow",
    explanation: "合同把入住、摆放家具或付款等行为视为验收合格，可能压缩业主后续维权空间。",
    whyItMatters: "装修质量问题可能在入住后才暴露。验收口径过严会让修复责任变得难谈。",
    suggestion: "明确第三方或双方签字验收标准，并保留合理整改期。",
    modification: "建议改为：验收应以合同约定标准、双方签字确认的验收单或第三方检测结果为准。入住、摆放家具或支付部分款项不当然视为放弃质量异议；发现问题后承包方应在约定期限内整改。",
    checklistQuestion: "验收标准是什么？发现问题后有多长整改期？入住是否一定等于放弃质量异议？"
  }
];

export function runRules(text: string, kind: DocumentKind): RiskFinding[] {
  return ruleDefinitions
    .filter((rule) => rule.kinds.includes(kind) || rule.kinds.includes("unknown"))
    .filter((rule) => includesAny(text, rule.terms))
    .map((rule) => ({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      explanation: rule.explanation,
      whyItMatters: rule.whyItMatters,
      suggestion: rule.suggestion,
      modification: rule.modification,
      evidence: findEvidence(text, rule.terms)
    }));
}

export function checklistFromRules(text: string, kind: DocumentKind) {
  return ruleDefinitions
    .filter((rule) => rule.kinds.includes(kind) || rule.kinds.includes("unknown"))
    .filter((rule) => includesAny(text, rule.terms))
    .map((rule) => ({
      question: rule.checklistQuestion,
      reason: rule.whyItMatters,
      severity: rule.severity
    }));
}
