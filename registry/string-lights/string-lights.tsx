'use client';
import { createElement, useEffect, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { createStringLights } from "@/lib/string-lights";
import type { StringController, StringOptions } from "@/lib/string-lights";
export type { StringOptions } from 'string-lights';
export interface StringLightsProps extends HTMLAttributes<HTMLDivElement> {
    fullPage?: boolean;
    options?: StringOptions;
}
/** Keep React-owned children separate from the imperative decoration host. */
export function StringLights({ children, fullPage = false, options, className, style, ...props }: StringLightsProps) {
    const host = useRef<HTMLDivElement>(null);
    const controller = useRef<StringController | null>(null);
    const mountedTarget = useRef<HTMLElement | null>(null);
    useEffect(() => {
        const element = host.current;
        if (!element)
            return;
        const target = fullPage ? element.ownerDocument.body : element;
        if (mountedTarget.current !== target || !controller.current) {
            controller.current?.destroy();
            controller.current = createStringLights(target, options);
            mountedTarget.current = target;
        }
        else {
            controller.current?.update(options);
        }
    }, [fullPage, options]);
    useEffect(() => () => {
        controller.current?.destroy();
        controller.current = null;
        mountedTarget.current = null;
    }, []);
    return createElement('div', { ...props, className, style: { position: 'relative', ...style } }, children, createElement('div', {
        ref: host,
        'aria-hidden': true,
        style: { position: 'absolute', inset: 0, pointerEvents: 'none' },
    }));
}
export default StringLights;
