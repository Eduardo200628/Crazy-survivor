import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { stageRewards, type Stage, type StageId } from "../catalog";
import { STAGE_BOSS_SIZES, STAGE_BOSS_SPRITES } from "../sprites";
import { HUB_COLORS, HUB_DEPTH, HUB_RADIUS, withAlpha } from "../theme";
import { Bevel } from "./Bevel";
import { Icon, type IconName } from "./Icon";
import { PixelButton } from "./PixelButton";

const BOSS_NAMES: Record<StageId, string> = {
  stage1: "Chiazo",
  stage2: "Ametrallador",
  stage3: "Coloso",
  stage4: "Tirano",
  stage5: "Nucleo Roto",
};

type Props = {
  stage: Stage;
  stages: Stage[];
  stagesCleared: number;
  selectedStage: StageId;
  challengeMultiplier: number;
  onSelectStage: (id: StageId) => void;
  onPlay: () => void;
  onChallenge: () => void;
};

type FirstWinReward = {
  icon: IconName;
  color: string;
  amount: number;
  label: string;
};

export function StagePanel({
  stage,
  stages,
  stagesCleared,
  selectedStage,
  challengeMultiplier,
  onSelectStage,
  onPlay,
  onChallenge,
}: Props) {
  const bossSize = STAGE_BOSS_SIZES[stage.id];
  const bossHp = Math.round(1600 * stage.difficulty);
  const expAmount = stageRewards(stage).find((item) => item.id === "exp")?.amount ?? 0;
  const firstWin: FirstWinReward[] = [
    { color: HUB_COLORS.yellow, icon: "coin", amount: stage.rewardCoins, label: "Monedas" },
    { color: HUB_COLORS.gem, icon: "gem", amount: stage.rewardGems, label: "Gemas" },
    { color: HUB_COLORS.text, icon: "book", amount: expAmount, label: "Libros EXP" },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.titleBlock}>
        <View style={[styles.zonePill, { backgroundColor: stage.accent }]}>
          <Text style={styles.zonePillText}>ZONA {stages.indexOf(stage) + 1}</Text>
        </View>
        <Text style={styles.stageTitle}>{stage.name}</Text>
        <Text style={styles.stageMeta}>
          {stage.subtitle} · {stage.duration}s · DIF {stage.difficulty.toFixed(1)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chipsRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {stages.map((item, index) => {
          const locked = index > stagesCleared;
          const selected = item.id === selectedStage;
          return (
            <Pressable
              key={item.id}
              disabled={locked}
              onPress={() => onSelectStage(item.id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipActive,
                locked && styles.chipLocked,
                {
                  backgroundColor: selected ? HUB_COLORS.yellow : HUB_COLORS.panel,
                  borderBottomColor: selected ? HUB_COLORS.amberDark : HUB_COLORS.shadow,
                  transform: [{ translateY: pressed ? 2 : 0 }],
                },
              ]}
            >
              {locked ? <Icon color={HUB_COLORS.textMuted} name="lock" size={12} /> : null}
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {index + 1}. {item.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Bevel
        color={HUB_COLORS.card}
        depth={HUB_DEPTH.flat}
        faceStyle={styles.objectiveFace}
        radius={HUB_RADIUS.large}
        rimColor={HUB_COLORS.cardBorder}
        style={styles.objective}
      >
        <Text style={styles.panelTitle}>OBJETIVO · OLEADA ACTUAL</Text>
        <View style={[styles.objectiveArt, { backgroundColor: withAlpha(stage.accent, 0.16) }]}>
          <Image
            resizeMode="contain"
            source={STAGE_BOSS_SPRITES[stage.id]}
            style={{ height: bossSize.height, width: bossSize.width }}
          />
        </View>
        <Text style={styles.objectiveName}>{BOSS_NAMES[stage.id]}</Text>
        <Text style={styles.objectiveMeta}>
          VIDA {bossHp} · DANO {Math.round(5 * stage.difficulty)}
        </Text>
      </Bevel>

      <View style={styles.firstWin}>
        <Text style={styles.panelTitle}>RECOMPENSA DE PRIMERA VICTORIA</Text>
        <View style={styles.rewardsRow}>
          {firstWin.map((item) => (
            <View key={item.label} style={styles.rewardPill}>
              <Icon color={item.color} name={item.icon} size={20} />
              <Text style={styles.rewardAmount}>+{item.amount}</Text>
              <Text numberOfLines={1} style={styles.rewardLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.breathing} />

      <View style={styles.ctaRow}>
        <View style={styles.ctaMain}>
          <PixelButton
            fullWidth
            icon="target"
            label="JUGAR"
            onPress={onPlay}
            sublabel={`${stage.name} · ${stage.duration}s`}
          />
        </View>
        <PixelButton
          compact
          icon="map"
          label="Desafío"
          onPress={onChallenge}
          sublabel={`Gemas x${challengeMultiplier}`}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  titleBlock: {
    alignItems: "center",
    gap: 5,
    paddingTop: 4,
  },
  zonePill: {
    borderBottomColor: HUB_COLORS.shadow,
    borderBottomWidth: 3,
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zonePillText: {
    color: HUB_COLORS.textDark,
    fontSize: 11,
    fontWeight: "900",
  },
  stageTitle: {
    color: HUB_COLORS.text,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  stageMeta: {
    color: HUB_COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    alignItems: "center",
    borderBottomWidth: 3,
    borderColor: HUB_COLORS.panelBorder,
    borderRadius: HUB_RADIUS.pill,
    borderTopColor: HUB_COLORS.gloss,
    borderTopWidth: 2,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    borderColor: HUB_COLORS.amberDark,
  },
  chipLocked: {
    opacity: 0.45,
  },
  chipText: {
    color: HUB_COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  chipTextActive: {
    color: HUB_COLORS.textDark,
  },
  objective: {},
  objectiveFace: {
    alignItems: "center",
    gap: 6,
    padding: 16,
  },
  panelTitle: {
    color: HUB_COLORS.yellow,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  objectiveArt: {
    alignItems: "center",
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    height: 112,
    justifyContent: "center",
    overflow: "hidden",
    width: 112,
  },
  objectiveName: {
    color: HUB_COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  objectiveMeta: {
    color: HUB_COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  firstWin: {
    gap: 8,
  },
  rewardsRow: {
    flexDirection: "row",
    gap: 8,
  },
  rewardPill: {
    alignItems: "center",
    backgroundColor: HUB_COLORS.card,
    borderBottomColor: HUB_COLORS.backgroundDeep,
    borderBottomWidth: 4,
    borderColor: HUB_COLORS.cardBorder,
    borderRadius: HUB_RADIUS.medium,
    borderTopColor: HUB_COLORS.glossSoft,
    borderTopWidth: 2,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  rewardAmount: {
    color: HUB_COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  rewardLabel: {
    color: HUB_COLORS.textMuted,
    fontSize: 10,
  },
  breathing: {
    height: 48,
  },
  ctaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaMain: {
    flex: 1,
  },
});
