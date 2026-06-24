# Custom components in Paths

In rare cases where we can't reach a city's UI needs with theming alone,
custom components can be added. To ensure these components are only included
in the client bundle when needed, custom components are referenced by theme name
and loaded dynamically.

### How it works

1. Add a component to be loaded dynamically in `src/components/custom/[theme-name]` e.g. `src/components/custom/sunnydale/GlobalNav`
2. Add the component to the `CUSTOM_COMPONENTS` map
3. Add (or reuse) a "slot" component (e.g. `GlobalNavSlot`) that resolves the
   custom-or-fallback implementation for the active theme and renders it, then
   use that slot wherever the component may be rendered.

The slot must select the component and render it in the same scope (rather than
returning it from a hook) so the React Compiler can verify the rendered
component is static; see the comment in `index.tsx`.
