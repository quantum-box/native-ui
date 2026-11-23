import { Sparkles } from 'lucide-react'

import { cn } from '../../lib/utils'

/*
 * AI がその値を出した理由と、判断の材料。データ基盤の `FactSource`（出典）と並ぶ物で、
 * `AiValue`・`AiLabel`・`AiField` のどれにも同じ物を渡せる。
 * どの項目も、渡したときだけ出す。
 */

/** 確からしさ。言葉か、0〜1 の数。 */
type AiConfidence = 'high' | 'medium' | 'low' | number

interface AiReasoning {
	/** なぜこの値か。例「業務用 500g で約 1,500 円の相場から」。 */
	reason?: string
	/** AI に渡した物。例「材料の名前『八角』と単位『g』だけ」。いくつかあれば配列で。 */
	inputs?: string | string[]
	/** 確からしさ。'high'・'medium'・'low' か、0〜1 の数。 */
	confidence?: AiConfidence
	/** どの AI で出したか。例「Claude」。 */
	model?: string
	/** いつ出したか。例「2026年11月24日 10:42」。 */
	createdAt?: string
	/** 人がまだ確かめていない値か。既定は true（「人が確かめていない値です」と出す）。 */
	unverified?: boolean
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

const LEVEL_TEXT: Record<ConfidenceLevel, string> = {
	high: '高い',
	medium: 'ふつう',
	low: '低い',
}

/** 確からしさを 3 段に直す。数のときは 0.8 以上を高い、0.5 以上をふつうとする。 */
function confidenceLevel(confidence: AiConfidence): ConfidenceLevel {
	if (typeof confidence !== 'number') return confidence
	if (confidence >= 0.8) return 'high'
	if (confidence >= 0.5) return 'medium'
	return 'low'
}

function confidenceText(confidence: AiConfidence) {
	const level = LEVEL_TEXT[confidenceLevel(confidence)]
	return typeof confidence === 'number'
		? `${level}（${Math.round(confidence * 100)}%）`
		: level
}

/** 確からしさが低いか。低いときは見た目を橙にする。 */
function isLowConfidence(reasoning?: AiReasoning) {
	return (
		reasoning?.confidence !== undefined &&
		confidenceLevel(reasoning.confidence) === 'low'
	)
}

/** 判断の中身に、見せる物が 1 つでもあるか。無ければ枠は開かない。 */
function hasReasoning(reasoning?: AiReasoning): reasoning is AiReasoning {
	return Boolean(
		reasoning &&
			(reasoning.reason ||
				(reasoning.inputs && reasoning.inputs.length > 0) ||
				reasoning.confidence !== undefined ||
				reasoning.model ||
				reasoning.createdAt),
	)
}

function inputList(inputs?: string | string[]) {
	if (!inputs) return []
	return Array.isArray(inputs) ? inputs : [inputs]
}

/** 文の終わりの「。」を除く（つなげたときに「。。」にならないように）。 */
const trimPeriod = (text: string) => text.replace(/。+$/, '')

/** 画面を読む道具に伝える文。 */
function reasoningSentence(reasoning: AiReasoning) {
	const parts: string[] = []
	if (reasoning.reason) parts.push(`理由: ${trimPeriod(reasoning.reason)}。`)
	const inputs = inputList(reasoning.inputs)
	if (inputs.length)
		parts.push(`判断の材料: ${inputs.map(trimPeriod).join('、')}。`)
	if (reasoning.confidence !== undefined)
		parts.push(`確からしさ: ${confidenceText(reasoning.confidence)}。`)
	if (reasoning.model || reasoning.createdAt)
		parts.push(
			`出した AI: ${[reasoning.createdAt, reasoning.model].filter(Boolean).join('・')}。`,
		)
	if (reasoning.unverified !== false) parts.push('人が確かめていない値です。')
	return parts.join('')
}

/** 判断の中身。AI の値に触れたときに開く枠の中で使う。 */
function AiReasoningDetails({
	reasoning,
	title = 'AI の推測',
	className,
}: Readonly<{ reasoning: AiReasoning; title?: string; className?: string }>) {
	const inputs = inputList(reasoning.inputs)
	const low = isLowConfidence(reasoning)
	return (
		<div className={cn('grid gap-2 text-xs', className)}>
			<p className='flex items-center gap-1.5 font-medium text-sm text-violet-700 dark:text-violet-300'>
				<Sparkles aria-hidden className='size-3.5' />
				{title}
			</p>
			{reasoning.reason ? (
				<p className='text-foreground leading-relaxed'>{reasoning.reason}</p>
			) : null}
			<dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1'>
				{inputs.length ? (
					<>
						<dt className='text-muted-foreground'>判断の材料</dt>
						<dd>
							{inputs.length === 1 ? (
								inputs[0]
							) : (
								<ul className='list-disc pl-4'>
									{inputs.map(input => (
										<li key={input}>{input}</li>
									))}
								</ul>
							)}
						</dd>
					</>
				) : null}
				{reasoning.confidence !== undefined ? (
					<>
						<dt className='text-muted-foreground'>確からしさ</dt>
						<dd className='flex items-center gap-1.5'>
							<span
								aria-hidden
								className={cn(
									'size-1.5 rounded-full',
									confidenceLevel(reasoning.confidence) === 'high' &&
										'bg-violet-500',
									confidenceLevel(reasoning.confidence) === 'medium' &&
										'bg-fuchsia-400',
									low && 'bg-amber-500',
								)}
							/>
							<span className={cn(low && 'text-amber-700 dark:text-amber-300')}>
								{confidenceText(reasoning.confidence)}
							</span>
						</dd>
					</>
				) : null}
				{reasoning.model || reasoning.createdAt ? (
					<>
						<dt className='text-muted-foreground'>出した AI</dt>
						<dd>
							{[reasoning.createdAt, reasoning.model]
								.filter(Boolean)
								.join('・')}
						</dd>
					</>
				) : null}
			</dl>
			{reasoning.unverified !== false ? (
				<p className='border-border border-t pt-2 text-muted-foreground'>
					人が確かめていない値です。確かめてから使ってください。
				</p>
			) : null}
		</div>
	)
}

export {
	type AiConfidence,
	type AiReasoning,
	AiReasoningDetails,
	hasReasoning,
	isLowConfidence,
	reasoningSentence,
}
