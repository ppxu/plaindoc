import type { DocumentKind, RiskFinding, Severity } from "../types";
import { findEvidence, includesAny } from "./patterns";

interface RuleDefinition {
  id: string;
  kinds: DocumentKind[];
  terms: string[];
  requiredTerms?: string[];
  supportingTerms?: string[];
  excludedTerms?: string[];
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
    requiredTerms: ["提前退租"],
    supportingTerms: ["两个月租金", "两个月房租", "60 日", "60日", "六十日", "押金中直接扣除", "直接扣除未付租金、违约金"],
    excludedTerms: ["最高不超过一个月租金", "不得重复计算", "实际空置损失", "提前 30 日", "提前30日"],
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
    requiredTerms: ["押金"],
    supportingTerms: ["扣除", "直接扣除", "甲方认为必要"],
    excludedTerms: ["押金扣除仅限", "经双方确认的人为损坏", "应提供发票", "报价单或双方确认记录", "退租交接后 7 日内退还剩余押金"],
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
    requiredTerms: ["损坏"],
    supportingTerms: ["所有设施设备损坏均由乙方负责", "乙方负责维修或赔偿", "先行垫付维修费用", "乙方应先行垫付", "均由乙方负责维修"],
    excludedTerms: ["自然老化或非人为损坏由甲方负责", "自然老化由甲方负责", "自然老化由甲方承担", "非人为损坏由甲方负责", "非人为损坏由甲方承担"],
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
    requiredTerms: ["竞业限制"],
    supportingTerms: ["离职后两年", "补偿金标准由甲方另行制定", "不得加入与甲方存在竞争关系", "不得自行或协助他人经营类似业务", "确认已充分理解并同意"],
    excludedTerms: ["仅适用于双方书面列明", "按月支付明确补偿金", "公司未按期支付补偿", "员工不再受该限制约束"],
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
    requiredTerms: ["提前"],
    supportingTerms: ["90 日", "90日", "九十日", "三个月", "3 个月", "3个月"],
    excludedTerms: ["提前 30 日", "提前30日", "提前三十日", "法定标准"],
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
    requiredTerms: ["违约金"],
    supportingTerms: ["200000", "200,000", "20 万", "20万", "二十万", "贰拾万", "壹拾万", "十万"],
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
    requiredTerms: ["首期款"],
    supportingTerms: ["支付总价 60%", "总价 60%", "总价60%", "60%", "60％", "６０％", "六成", "过半", "一半以上"],
    excludedTerms: ["支付总价 10% 作为首期款", "支付总价10%作为首期款", "支付总价 10％ 作为首期款", "10% 作为首期款", "10％ 作为首期款"],
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
    requiredTerms: ["增项"],
    supportingTerms: ["先行施工", "结算时计入总价", "结算时计入", "不影响已施工项目的付款义务"],
    excludedTerms: ["不得先行施工", "未经确认不得先行施工", "未经确认的费用不得在结算时计入总价", "业主有权拒绝支付"],
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
    requiredTerms: ["验收"],
    supportingTerms: ["即视为验收合格", "视为验收合格", "内部验收标准", "入住", "摆放家具"],
    title: "验收合格条件偏向承包方",
    severity: "yellow",
    explanation: "合同把入住、摆放家具或付款等行为视为验收合格，可能压缩业主后续维权空间。",
    whyItMatters: "装修质量问题可能在入住后才暴露。验收口径过严会让修复责任变得难谈。",
    suggestion: "明确第三方或双方签字验收标准，并保留合理整改期。",
    modification: "建议改为：验收应以合同约定标准、双方签字确认的验收单或第三方检测结果为准。入住、摆放家具或支付部分款项不当然视为放弃质量异议；发现问题后承包方应在约定期限内整改。",
    checklistQuestion: "验收标准是什么？发现问题后有多长整改期？入住是否一定等于放弃质量异议？"
  },
  {
    id: "loan-fees-deducted-from-principal",
    kinds: ["loan", "unknown"],
    terms: ["服务费", "账户管理费", "从借款本金中扣除"],
    requiredTerms: ["服务费"],
    supportingTerms: ["从借款本金中扣除", "借款本金中扣除", "本金中扣除", "直接从借款本金", "预先扣除", "放款时扣除"],
    excludedTerms: ["不从借款本金中扣除", "不得从借款本金中扣除", "不从本金中扣除", "不得从本金中扣除"],
    title: "费用可能先从本金中扣除",
    severity: "red",
    explanation: "合同允许出借方在放款时扣除服务费、管理费或咨询费，但还款本金和利息仍按名义借款金额计算。",
    whyItMatters: "实际到账金额低于合同本金时，真实资金成本会高于表面利率，借款人也更难判断总成本。",
    suggestion: "要求写清实际到账金额、所有费用、年化综合成本，并确认费用是否可以从本金中扣除。",
    modification: "建议改为：所有服务费、管理费、咨询费等费用应在合同中逐项列明，并与实际到账金额、还款本金分开计算。未经借款人书面确认，出借人不得从借款本金中预先扣除任何费用。",
    checklistQuestion: "实际到账多少钱？服务费、管理费和咨询费是否会从本金中先扣？综合年化成本是多少？"
  },
  {
    id: "loan-costly-prepayment",
    kinds: ["loan", "unknown"],
    terms: ["提前还款", "提前还款手续费", "剩余期限内应收利息"],
    requiredTerms: ["提前还款"],
    supportingTerms: ["提前还款手续费", "手续费", "剩余期限内应收利息", "剩余期限利息", "未还本金 3%", "应收利息"],
    excludedTerms: ["不收提前还款手续费", "免收提前还款手续费", "不收剩余期限利息", "不得收取剩余期限利息"],
    title: "提前还款成本可能偏高",
    severity: "yellow",
    explanation: "合同把提前还款与手续费、剩余利息补偿绑定，可能让借款人即使提前还钱也难以降低总成本。",
    whyItMatters: "提前还款通常是降低负债成本的方式；如果费用过高，借款人会失去灵活退出空间。",
    suggestion: "要求明确提前还款申请流程、手续费上限，以及是否还需要支付未发生的未来利息。",
    modification: "建议改为：借款人可提前全部或部分还款，出借人应按实际占用天数计算利息。提前还款手续费应设置明确上限，不得再收取未实际发生期间的利息或重复补偿。",
    checklistQuestion: "提前还款后还要付未来利息吗？手续费上限是多少？能否部分提前还款？"
  },
  {
    id: "loan-stacked-overdue-charges",
    kinds: ["loan", "unknown"],
    terms: ["每日 0.1%", "每日 0.05%", "罚息"],
    requiredTerms: ["罚息"],
    supportingTerms: ["每日 0.1%", "每日0.1%", "每日 0.05%", "每日0.05%", "违约金", "催收费", "律师费", "其他实现债权的费用"],
    excludedTerms: ["不重复收取违约金", "不得重复收取违约金", "不重复收取违约金、催收费", "不得重复计算"],
    title: "逾期费用可能叠加过高",
    severity: "red",
    explanation: "合同同时设置罚息、违约金和催收费等项目，逾期费用可能快速滚大。",
    whyItMatters: "逾期成本如果按日叠加，短期资金周转问题可能变成难以承受的债务压力。",
    suggestion: "要求明确逾期费用的计算基数、总上限，以及是否能与违约金、催收费重复收取。",
    modification: "建议改为：逾期费用应以实际逾期本金为计算基数，并设置总额上限。罚息、违约金、催收费等不得重复计算；出借人主张实现债权费用的，应提供实际发生且合理的凭证。",
    checklistQuestion: "逾期费用按本金还是本息计算？罚息、违约金、催收费是否会重复收？最高会到多少？"
  },
  {
    id: "loan-broad-acceleration-clause",
    kinds: ["loan", "unknown"],
    terms: ["全部借款立即到期", "任何一期逾期", "一次性清偿"],
    requiredTerms: ["逾期"],
    supportingTerms: ["全部借款立即到期", "立即到期", "提前到期", "任何一期逾期", "一次性清偿剩余本金"],
    excludedTerms: ["借款期限届满时", "到期时", "期限届满时"],
    title: "一次性到期条件过宽",
    severity: "red",
    explanation: "合同允许出借方在轻微或短期逾期时宣布全部借款提前到期，借款人可能被迫一次性还清全部余额。",
    whyItMatters: "一次性到期会放大短期逾期后果，也会削弱协商展期、补缴或分期处理的空间。",
    suggestion: "要求设置宽限期、补救期和重大违约条件，避免轻微逾期直接触发全部到期。",
    modification: "建议改为：只有借款人逾期达到约定天数且经出借人书面催告后仍未在补救期内清偿的，出借人才可宣布剩余借款提前到期。轻微逾期或已补足欠款的，不应触发全部借款立即到期。",
    checklistQuestion: "逾期几天会触发全部到期？是否有宽限期和补救期？补缴后能否恢复正常还款？"
  },
  {
    id: "insurance-broad-waiting-period-exclusion",
    kinds: ["insurance", "unknown"],
    terms: ["等待期 180 日", "既往症", "保险人不承担"],
    requiredTerms: ["等待期"],
    supportingTerms: ["保险人不承担", "不承担给付保险金责任", "既往症", "慢性病", "并发症"],
    excludedTerms: ["分别定义等待期和既往症", "已如实告知且保险人承保", "不得再作为拒赔理由", "不得作为拒赔理由"],
    title: "等待期和既往症免责范围较宽",
    severity: "red",
    explanation: "保单把等待期、既往症、慢性病和并发症放在同一免责框架下，可能让常见疾病或既有体征难以获赔。",
    whyItMatters: "保险最重要的是知道哪些情况不赔。等待期和既往症口径越宽，投保后真正能覆盖的风险就越窄。",
    suggestion: "签署前要求保险人书面解释等待期起算、既往症定义、体检异常和慢性病复发是否赔付。",
    modification: "建议改为：等待期、既往症和相关并发症应分别定义，并列明具体不赔情形。保险人主张既往症免责的，应说明判断依据；投保时已如实告知且保险人承保的事项，不得再作为拒赔理由。",
    checklistQuestion: "等待期从哪一天开始算？哪些既往症或体检异常会不赔？如实告知后承保的疾病还能拒赔吗？"
  },
  {
    id: "insurance-renewal-not-guaranteed",
    kinds: ["insurance", "unknown"],
    terms: ["续保", "重新审核", "拒绝续保"],
    requiredTerms: ["续保"],
    supportingTerms: ["重新审核", "拒绝续保", "调整责任范围", "历史理赔记录", "健康状况", "可调整保险费率"],
    excludedTerms: ["保证续保", "不得因被保险人发生理赔而拒绝续保", "不因理赔拒绝续保", "不得因理赔拒绝续保"],
    title: "续保稳定性不明确",
    severity: "red",
    explanation: "保单允许保险人在续保时重新审核健康状况或历史理赔记录，并可能调整责任范围或拒绝续保。",
    whyItMatters: "医疗险和长期保障的关键价值在于持续覆盖。续保不稳定时，发生理赔后反而可能失去后续保障。",
    suggestion: "确认是否保证续保、保证多久、费率如何调整，以及理赔后是否会影响下一年承保。",
    modification: "建议改为：保险人应明确是否保证续保、保证续保期间、续保条件和费率调整规则。被保险人在保险期间内发生理赔，不应单独作为拒绝续保或缩减责任范围的理由。",
    checklistQuestion: "这份保单是否保证续保？理赔后下一年会不会被拒保、除外或加费？费率调整依据是什么？"
  },
  {
    id: "insurance-broad-activity-occupation-exclusion",
    kinds: ["insurance", "unknown"],
    terms: ["高风险职业", "职业变更", "不承担赔偿责任"],
    requiredTerms: ["职业变更"],
    supportingTerms: ["未及时通知", "不承担赔偿责任", "免责", "拒赔", "不予赔付", "不承担给付保险金责任"],
    excludedTerms: ["继续承保、加费承保或解除合同", "书面告知继续承保", "书面告知继续承保、加费承保", "按约定方式通知保险人"],
    title: "免责活动和职业变更口径较宽",
    severity: "yellow",
    explanation: "条款把高风险活动、职业变更和通知义务连接到免责，可能让普通运动、临时活动或工作变化产生赔付争议。",
    whyItMatters: "很多拒赔争议来自免责条款边界不清。用户需要知道哪些活动、职业或变化会影响保障。",
    suggestion: "要求列明具体不保活动、职业类别、通知方式、补充承保或加费后的处理规则。",
    modification: "建议改为：免责活动和职业类别应以清单方式列明。职业变更或活动变化后，投保人按约定方式通知保险人的，保险人应明确继续承保、加费承保或书面解除，不应笼统免除所有相关责任。",
    checklistQuestion: "哪些运动或职业属于免责？职业变更后怎么通知？通知后还能继续承保吗？"
  },
  {
    id: "insurance-short-claim-notice-window",
    kinds: ["insurance", "unknown"],
    terms: ["10 日内通知保险人", "无法核实", "有权拒赔"],
    requiredTerms: ["通知保险人"],
    supportingTerms: ["无法核实", "有权拒赔", "拒赔"],
    excludedTerms: ["合理期限内补充说明", "可在合理期限内补充", "不得仅因迟延通知拒赔", "不得仅因延迟通知拒赔"],
    title: "理赔通知期限可能过短",
    severity: "yellow",
    explanation: "保单要求事故后较短时间内通知保险人，并把逾期通知和拒赔结果连接起来。",
    whyItMatters: "就医、住院或事故处理时，用户可能无法及时完成通知。通知期限过短会增加理赔不确定性。",
    suggestion: "要求把通知期限、可补正材料、逾期后果和保险人实际受影响范围写清楚。",
    modification: "建议改为：投保人或受益人应在知道保险事故后及时通知保险人；因客观原因未能及时通知的，可在合理期限内补充说明和材料。保险人仅能对因延迟通知而实际无法核实的部分主张相应影响。",
    checklistQuestion: "超过 10 天通知是否一定拒赔？住院、抢救或资料不全时能否补交材料？"
  }
];

export function runRules(text: string, kind: DocumentKind): RiskFinding[] {
  return ruleDefinitions
    .filter((rule) => isRuleEnabledForKind(rule, kind))
    .filter((rule) => matchesRule(text, rule))
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
    .filter((rule) => isRuleEnabledForKind(rule, kind))
    .filter((rule) => matchesRule(text, rule))
    .map((rule) => ({
      question: rule.checklistQuestion,
      reason: rule.whyItMatters,
      severity: rule.severity
    }));
}

function isRuleEnabledForKind(rule: RuleDefinition, kind: DocumentKind): boolean {
  return kind === "unknown" ? rule.kinds.includes("unknown") : rule.kinds.includes(kind);
}

function matchesRule(text: string, rule: RuleDefinition): boolean {
  if (rule.excludedTerms?.length && includesAny(text, rule.excludedTerms)) {
    return false;
  }

  if (!rule.requiredTerms?.length) {
    return includesAny(text, rule.terms);
  }

  return includesAll(text, rule.requiredTerms) && (!rule.supportingTerms?.length || includesAny(text, rule.supportingTerms));
}

function includesAll(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.every((term) => normalized.includes(term.toLowerCase()));
}
