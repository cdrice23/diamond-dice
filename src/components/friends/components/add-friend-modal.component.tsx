import { PixelIcon } from '@/components/branding/components/pixel-icon.component';
import { BottomSheetModal } from '@/components/primitives/bottom-sheet-modal.component';
import { Input } from '@/components/primitives/input.component';
import { Text } from '@/components/primitives/text.component';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback.hook';
import { useTheme } from '@/utils/theme-provider';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useFriendRequests } from '../hooks/use-friend-requests.hook';
import { useFriendSearch, type FriendSearchResult } from '../hooks/use-friend-search.hook';
import { FriendSearchResultRow } from './friend-search-result-row.component';
import { SendFriendRequestConfirmationModal } from './send-friend-request-confirmation-modal.component';

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_ICON_SIZE = 18;

type AddFriendModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

export function AddFriendModal({ visible, onDismiss }: AddFriendModalProps) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<FriendSearchResult | null>(null);

  const { results, loading, loadingMore, hasMore, loadMore, hasQuery } = useFriendSearch(searchTerm);
  const { sendFriendRequest } = useFriendRequests();

  const debouncedSetSearchTerm = useDebouncedCallback(setSearchTerm, SEARCH_DEBOUNCE_MS);

  function handleChangeText(text: string) {
    setInputValue(text);
    debouncedSetSearchTerm(text);
  }

  function handleDismiss() {
    setInputValue('');
    setSearchTerm('');
    onDismiss();
  }

  return (
    <>
      <BottomSheetModal visible={visible} onDismiss={handleDismiss}>
        <View className="bg-background gap-3 rounded-t-2xl p-5 pb-8" style={{ minHeight: 420 }}>
          <Text className="text-foreground text-lg font-bold">Add a Friend</Text>

          <View className="relative justify-center">
            <View className="absolute left-3 z-10" style={{ height: SEARCH_ICON_SIZE }}>
              <PixelIcon name="search" size={SEARCH_ICON_SIZE} color={colors.mutedForeground} />
            </View>
            <Input
              value={inputValue}
              onChangeText={handleChangeText}
              placeholder="Search by username or name"
              accessibilityLabel="Search for a friend"
              className="pl-10"
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {!hasQuery ? (
            <Text variant="muted" className="pt-6 text-center text-sm">
              Start typing to find friends by username or display name.
            </Text>
          ) : loading ? (
            <ActivityIndicator className="pt-6" color={colors.mutedForeground} />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.profileId}
              renderItem={({ item, index }) => (
                <View style={index > 0 ? { borderTopWidth: 1, borderColor: colors.border } : undefined}>
                  <FriendSearchResultRow
                    username={item.username}
                    displayName={item.displayName}
                    relationshipStatus={item.relationshipStatus}
                    onAddPress={() => setSelectedResult(item)}
                  />
                </View>
              )}
              onEndReached={() => {
                if (hasMore) loadMore();
              }}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <Text variant="muted" className="pt-6 text-center text-sm">
                  No matching profiles found.
                </Text>
              }
              ListFooterComponent={loadingMore ? <ActivityIndicator className="py-3" color={colors.mutedForeground} /> : null}
            />
          )}
        </View>
      </BottomSheetModal>

      <SendFriendRequestConfirmationModal
        visible={selectedResult !== null}
        displayName={selectedResult?.displayName ?? ''}
        onCancel={() => setSelectedResult(null)}
        onConfirm={async () => {
          if (!selectedResult) return;
          await sendFriendRequest(selectedResult.profileId);
          setSelectedResult(null);
        }}
      />
    </>
  );
}