import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getEffectiveFee, EXCHANGE_FEES } from '@/lib/constants/exchanges'

export function useExchangeFees() {
  const [selectedExchange, setSelectedExchange] = useState<string>('bitget')
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [customMakerFee, setCustomMakerFee] = useState<number | null>(null)
  const [customTakerFee, setCustomTakerFee] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: settings } = await supabase
          .from('user_settings')
          .select('selected_exchange, default_order_type, custom_maker_fee, custom_taker_fee')
          .eq('user_id', user.id)
          .maybeSingle()

        if (settings) {
          if (settings.selected_exchange) setSelectedExchange(settings.selected_exchange)
          if (settings.default_order_type) setOrderType(settings.default_order_type)
          setCustomMakerFee(settings.custom_maker_fee)
          setCustomTakerFee(settings.custom_taker_fee)
        }
      } catch (err) {
        console.error('Fehler beim Laden der Fee-Settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Aktuell angewendeter Prozentsatz
  const currentFeePercentage = getEffectiveFee({
    exchangeId: selectedExchange,
    orderType,
    customMakerFee,
    customTakerFee
  })

  return {
    selectedExchange,
    setSelectedExchange,
    orderType,
    setOrderType,
    currentFeePercentage,
    exchangeName: EXCHANGE_FEES[selectedExchange]?.name || 'Bitget',
    loading
  }
}