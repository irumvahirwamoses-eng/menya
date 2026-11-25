import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../../context/AppContext'
import { completionTrend, masteryData, weeklyActivity } from '../../data/mock'
import { useT } from '../../i18n'

const lightPalette = {
  emerald: '#0D9B78',
  amber: '#F2B84B',
  info: '#3478D4',
  muted: '#526174',
  border: '#DCE4EC',
  surface: '#FFFFFF',
  text: '#142B4A',
}

const darkPalette = {
  emerald: '#29C69C',
  amber: '#F6C76A',
  info: '#6EA4EC',
  muted: '#9DB0C5',
  border: '#2A3E56',
  surface: '#19283B',
  text: '#EDF3F9',
}

function useChartColors() {
  const { theme } = useApp()
  return useMemo(() => (theme === 'dark' ? darkPalette : lightPalette), [theme])
}

interface TooltipPayload {
  value?: number
  name?: string
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string | number
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[10px] border border-line bg-surface-raised px-3 py-2 shadow-pop">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 text-[12px] font-bold tabular-nums">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.value}{suffix}
          {entry.name && entry.name !== 'minutes' && entry.name !== 'value' && (
            <span className="ml-1 font-normal text-muted">{entry.name}</span>
          )}
        </p>
      ))}
    </div>
  )
}

const axisStyle = { fontSize: 10, fontWeight: 600 }

export function WeeklyActivityChart({ height = 220 }: { height?: number }) {
  const colors = useChartColors()
  const t = useT()
  const data = weeklyActivity.map((item) => ({ ...item, day: t(item.day) }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="3 4" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: colors.muted, ...axisStyle }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.muted, ...axisStyle }} />
          <ReferenceLine y={45} stroke={colors.amber} strokeDasharray="4 4" strokeWidth={1.5} />
          <Tooltip content={<ChartTooltip suffix=" min" />} cursor={{ fill: colors.emerald, fillOpacity: 0.06 }} />
          <Bar dataKey="minutes" radius={[6, 6, 2, 2]} maxBarSize={36}>
            {data.map((entry, index) => (
              <Cell key={entry.day} fill={entry.minutes >= 45 ? colors.emerald : index === 6 ? colors.border : colors.info} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompletionTrendChart({ height = 210 }: { height?: number }) {
  const colors = useChartColors()
  const t = useT()
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={completionTrend} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.emerald} stopOpacity={0.25} />
              <stop offset="100%" stopColor={colors.emerald} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={colors.border} strokeDasharray="3 4" />
          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: colors.muted, ...axisStyle }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: colors.muted, ...axisStyle }} />
          <Tooltip content={<ChartTooltip suffix="%" />} cursor={{ stroke: colors.emerald, strokeDasharray: '3 3' }} />
          <Area
            type="monotone"
            dataKey="value"
            name={t('completion')}
            stroke={colors.emerald}
            strokeWidth={2.5}
            fill="url(#trendFill)"
            dot={{ r: 3, fill: colors.emerald, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MasteryChart() {
  const t = useT()
  return (
    <div className="space-y-3.5">
      {masteryData.map((item) => (
        <div key={item.skill}>
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="font-semibold">{t(item.skill)}</span>
            <span className="font-bold tabular-nums text-muted">{item.value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${item.value}%`,
                background: item.value >= 80 ? 'var(--emerald)' : item.value >= 60 ? 'var(--info)' : 'var(--amber)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
