import { View } from 'react-native'
import {
  computeStats,
  formatCLP,
  formatPercent,
  formatSignedCLP,
  type Bankroll,
  type Bet,
} from '@futbolismo/core'
import { Txt } from '@/components/ui'
import { c, radius } from '@/theme'

export function BankrollSummary({
  bankroll,
  bets,
}: {
  bankroll: Bankroll
  bets: Bet[]
}) {
  const stats = computeStats(bets)
  const net = bankroll.currentAmount - bankroll.initialAmount
  const roi = bankroll.initialAmount ? (net / bankroll.initialAmount) * 100 : 0
  const pos = net >= 0
  const committed = bets
    .filter((b) => b.status === 'pending')
    .reduce((a, b) => a + b.stake, 0)

  return (
    <View style={{ gap: 10 }}>
      <View>
        <Txt size={11} faint>
          BANCA ACTUAL
        </Txt>
        <Txt weight="700" size={24}>
          {formatCLP(bankroll.currentAmount)}
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Metric label="Inicial" value={formatCLP(bankroll.initialAmount)} />
        <Metric
          label="G/P neta"
          value={formatSignedCLP(net)}
          tone={pos ? 'pos' : 'neg'}
        />
        <Metric label="ROI" value={formatPercent(roi)} tone={pos ? 'pos' : 'neg'} />
        <Metric label="Comprometido" value={formatCLP(committed)} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(30,41,59,0.5)',
          borderRadius: radius.md,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Txt size={11} faint>
          {stats.count} apuestas
        </Txt>
        <Txt size={11} faint>
          {stats.pending} pend.
        </Txt>
        <Txt size={11} color={c.emerald}>
          {stats.won}G
        </Txt>
        <Txt size={11} color={c.rose}>
          {stats.lost}P
        </Txt>
      </View>
    </View>
  )
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
}) {
  return (
    <View
      style={{
        width: '47%',
        backgroundColor: 'rgba(30,41,59,0.4)',
        borderRadius: radius.md,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Txt size={10} faint>
        {label.toUpperCase()}
      </Txt>
      <Txt weight="600" color={tone === 'pos' ? c.emerald : tone === 'neg' ? c.rose : c.text}>
        {value}
      </Txt>
    </View>
  )
}
