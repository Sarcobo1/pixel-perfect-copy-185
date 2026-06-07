---
name: Spinning border CSS
description: How to implement a spinning conic-gradient border on a card without the gradient bleeding through the card background
---

## Rule
Use `@property --angle` + a wrapper div. Never use `::before` with `z-index:-1` + `isolation:isolate`.

## Why
CSS stacking order within a stacking context paints negative z-index descendants **above** the parent's background (step 1=bg, step 2=negative-z children). So `::before` at `z-index:-1` always shows above the card's own `background` color, filling the card with the gradient instead of only showing it at the border edge.

## How to apply
```css
@property --angle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

.card-wrap {
  border-radius: 18px;
  padding: 1.5px;                /* controls border thickness */
  background: conic-gradient(from var(--angle), var(--acc), transparent 30%, transparent 70%, var(--acc));
  animation: rise .8s both, spin-border 5s linear infinite;
  animation-delay: 0s, 0s;
}
.card-inner {
  height: 100%;
  border-radius: 16.5px;        /* inner-radius = outer-radius - padding */
  background: var(--surf);      /* solid dark fill — fully covers the gradient */
}
@keyframes spin-border { to { --angle: 360deg } }
```

The wrapper holds the spinning gradient; the inner div holds the solid background + content. Since the inner div's background is painted in the normal box-model flow (not stacking-context tricks), it always covers the wrapper gradient behind it — only the 1.5px padding gap is visible as the border.

Browser support: Chrome 85+, Firefox 128+, Safari 15.4+, Edge 85+.
