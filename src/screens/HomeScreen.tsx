import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  coins: number;
  bestScore: number;
  bestLevel: number;
  onPlay: () => void;
  onClaimReward: () => Promise<void>;
};

export function HomeScreen({ coins, bestScore, bestLevel, onPlay, onClaimReward }: Props) {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (claiming) {
      return;
    }
    setClaiming(true);
    try {
      await onClaimReward();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle}>CRAZY</Text>
          <Text style={styles.brandTitleAccent}>SURVIVOR</Text>
          <Text style={styles.brandSubtitle}>Aguanta la oleada</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Monedas</Text>
            <Text style={styles.statValue}>🪙 {coins}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Mejor puntaje</Text>
            <Text style={styles.statValue}>{bestScore}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Nivel maximo</Text>
            <Text style={styles.statValue}>{bestLevel}</Text>
          </View>
        </View>

        <Pressable style={styles.playButton} onPress={onPlay}>
          <Text style={styles.playButtonText}>JUGAR</Text>
        </Pressable>

        <Pressable
          style={[styles.rewardButton, claiming && styles.buttonDisabled]}
          onPress={handleClaim}
          disabled={claiming}
        >
          {claiming ? (
            <ActivityIndicator color="#0b0e17" />
          ) : (
            <Text style={styles.rewardButtonText}>Ver anuncio: +50 monedas</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0e17",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  brandBlock: {
    marginBottom: 36,
  },
  brandTitle: {
    color: "#f2f4fa",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandTitleAccent: {
    color: "#ffd166",
    fontSize: 46,
    fontWeight: "900",
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: "#8b93a7",
    fontSize: 16,
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: "#12182a",
    borderColor: "#222c45",
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 28,
    padding: 20,
  },
  statRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#8b93a7",
    fontSize: 15,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  playButton: {
    alignItems: "center",
    backgroundColor: "#ffd166",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 58,
  },
  playButtonText: {
    color: "#0b0e17",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  rewardButton: {
    alignItems: "center",
    backgroundColor: "#232c45",
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 52,
  },
  rewardButtonText: {
    color: "#ffd166",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});