import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { BattingOrderRow } from '@/components/teams/components/batting-order-row.component';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ShadowDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import type { WizardPositionSlot } from '../teams.types';

type AddTeamBattingOrderStepProps = {
  positionSlots: WizardPositionSlot[];
  battingOrder: string[];
  onChangeBattingOrder: (order: string[]) => void;
};

function buildInitialOrder(positionSlots: WizardPositionSlot[], savedOrder: string[]): WizardPositionSlot[] {
  const bySlotId = new Map(positionSlots.map((slot) => [slot.playerId, slot]));
  const currentPlayerIds = positionSlots.map((slot) => slot.playerId).filter((id): id is string => id !== null);
  const isValidSavedOrder = savedOrder.length === currentPlayerIds.length && currentPlayerIds.every((id) => savedOrder.includes(id));
  const orderIds = isValidSavedOrder ? savedOrder : currentPlayerIds;
  return orderIds.map((id) => bySlotId.get(id)).filter((slot): slot is WizardPositionSlot => !!slot);
}

export function AddTeamBattingOrderStep({ positionSlots, battingOrder, onChangeBattingOrder }: AddTeamBattingOrderStepProps) {
  const [orderedSlots, setOrderedSlots] = useState<WizardPositionSlot[]>(() => buildInitialOrder(positionSlots, battingOrder));

  useEffect(() => {
    onChangeBattingOrder(orderedSlots.map((slot) => slot.playerId).filter((id): id is string => id !== null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSlots]);

  function handleDragEnd({ data }: { data: WizardPositionSlot[] }) {
    setOrderedSlots(data);
  }

  return (
    <View style={{ flex: 1 }} className="px-4">
      <DraggableFlatList
        data={orderedSlots}
        keyExtractor={(slot) => slot.playerId ?? ''}
        onDragEnd={handleDragEnd}
        animationConfig={{ damping: 24, stiffness: 300 }}
        renderItem={({ item, drag, isActive, getIndex }: RenderItemParams<WizardPositionSlot>) => (
          <ShadowDecorator>
            <AnimatedCascadeItem index={getIndex() ?? 0} staggerDelayMs={30} fadeDurationMs={250} translateYStart={6}>
              <View className="py-0.5">
                <BattingOrderRow slot={item} order={(getIndex() ?? 0) + 1} onDragStart={drag} isActive={isActive} />
              </View>
            </AnimatedCascadeItem>
          </ShadowDecorator>
        )}
      />
    </View>
  );
}