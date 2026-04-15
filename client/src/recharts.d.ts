// Recharts 2.x class components are not compatible with React 19's stricter
// JSX element type checking. This declaration re-exports them as functional
// components so TypeScript accepts them as valid JSX.
//
// See: https://github.com/recharts/recharts/issues/3615

import type { ComponentProps, FC } from 'react';
import * as R from 'recharts';

declare module 'recharts' {
  export declare const Line: FC<ComponentProps<typeof R.Line>>;
  export declare const Bar: FC<ComponentProps<typeof R.Bar>>;
  export declare const Area: FC<ComponentProps<typeof R.Area>>;
  export declare const XAxis: FC<ComponentProps<typeof R.XAxis>>;
  export declare const YAxis: FC<ComponentProps<typeof R.YAxis>>;
  export declare const Tooltip: FC<ComponentProps<typeof R.Tooltip>>;
  export declare const Legend: FC<ComponentProps<typeof R.Legend>>;
  export declare const CartesianGrid: FC<ComponentProps<typeof R.CartesianGrid>>;
  export declare const ResponsiveContainer: FC<ComponentProps<typeof R.ResponsiveContainer>>;
  export declare const LineChart: FC<ComponentProps<typeof R.LineChart>>;
  export declare const BarChart: FC<ComponentProps<typeof R.BarChart>>;
  export declare const AreaChart: FC<ComponentProps<typeof R.AreaChart>>;
}
