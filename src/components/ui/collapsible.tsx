'use client'

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'

/** 押すと開いたり閉じたりする囲み。Radix の Collapsible をそのまま使う。 */
const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.Trigger

const CollapsibleContent = CollapsiblePrimitive.Content

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
