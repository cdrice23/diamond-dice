import { AnimatedCascadeItem } from '@/components/primitives/animated-cascade-item.component';
import { BattingOrderRow } from '@/components/teams/components/batting-order-row.component';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import DraggableFlatList, { ShadowDecorator, type RenderItemParams } from 'react-native-draggable-flatlist';
import type { WizardPositionSlot } from '../teams.types';

type AddTeamBattingOrderStepProps = {
  positionSlots: WizardPositionSlot[];
  battingOrder: string[];
  onChangeBattingOrder: (order: string[]) => void;
};

type DragPreview = { from: number; to: number };

function buildInitialOrder(positionSlots: WizardPositionSlot[], savedOrder: string[]): WizardPositionSlot[] {
  const bySlotId = new Map(positionSlots.map((slot) => [slot.playerId, slot]));
  const currentPlayerIds = positionSlots.map((slot) => slot.playerId).filter((id): id is string => id !== null);
  const isValidSavedOrder = savedOrder.length === currentPlayerIds.length && currentPlayerIds.every((id) => savedOrder.includes(id));
  const orderIds = isValidSavedOrder ? savedOrder : currentPlayerIds;
  return orderIds.map((id) => bySlotId.get(id)).filter((slot): slot is WizardPositionSlot => !!slot);
}

function applyPreviewMove(list: WizardPositionSlot[], preview: DragPreview | null): WizardPositionSlot[] {
  if (!preview || preview.from === preview.to) return list;
  const next = [...list];
  const [moved] = next.splice(preview.from, 1);
  next.splice(preview.to, 0, moved);
  return next;
}

export function AddTeamBattingOrderStep({ positionSlots, battingOrder, onChangeBattingOrder }: AddTeamBattingOrderStepProps) {
  const [orderedSlots, setOrderedSlots] = useState<WizardPositionSlot[]>(() => buildInitialOrder(positionSlots, battingOrder));
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [isReleased, setIsReleased] = useState(false);

  useEffect(() => {
    onChangeBattingOrder(orderedSlots.map((slot) => slot.playerId).filter((id): id is string => id !== null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSlots]);

  const displaySlots = useMemo(() => applyPreviewMove(orderedSlots, dragPreview), [orderedSlots, dragPreview]);
  const orderIndexByPlayerId = useMemo(() => new Map(displaySlots.map((slot, index) => [slot.playerId, index])), [displaySlots]);

  function handleDragBegin(index: number) {
    setIsReleased(false);
    setDragPreview({ from: index, to: index });
  }

  function handlePlaceholderIndexChange(index: number) {
    setDragPreview((prev) => (prev ? { ...prev, to: index } : prev));
  }

  function handleRelease() {
    setIsReleased(true);
  }

  function handleDragEnd({ data }: { data: WizardPositionSlot[] }) {
    setOrderedSlots(data);
    setDragPreview(null);
    setIsReleased(false);
  }

  return (
    <View style={{ flex: 1 }} className="px-4">
      <DraggableFlatList
        data={orderedSlots}
        keyExtractor={(slot) => slot.playerId ?? ''}
        onDragBegin={handleDragBegin}
        onPlaceholderIndexChange={handlePlaceholderIndexChange}
        onRelease={handleRelease}
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