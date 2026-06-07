Bar chart for seizure frequency over time. Calm gold bars (never alarming red), the current period highlighted in strong brand gold, and optional dashed annotations to mark medication changes so trends read in context.

```jsx
<BarChart
  height={170}
  data={[
    { label:'Jan', value:4 }, { label:'Fev', value:3 },
    { label:'Mar', value:5 }, { label:'Abr', value:2 },
    { label:'Mai', value:2 }, { label:'Jun', value:1, highlight:true },
  ]}
  annotations={[{ index:3, label:'Dose ajustada' }]}
/>
```

Width is fluid (fills its container); `height` sets the plot height. `highlight` marks the current bar; `annotations` drop dashed event markers. Values use tabular figures.
