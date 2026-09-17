import { useEffect, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  applyUpgrade,
  createGame,
  pickUpgradeChoices,
  revivePlayer,
  scoreOf,
  updateGame,
  type Enemy,
  type EnemyKind,
  type GameEvent,
  type GameState,
  type Vec,
} from "../engine";
import type { Upgrade } from "../upgrades";
import { showRewardedAd } from "../ads";

export type SessionResult = {
  score: number;
  coins: number;
  level: number;
  kills: number;
  time: number;
  revived: boolean;
};

type Phase = "playing" | "levelup" | "gameover";

type Props = {
  onFinish: (session: SessionResult) => void;
};

const ENEMY_COLORS: Record<EnemyKind, string> = {
  walker: "#e5484d",
  runner: "#ff9f43",
  tank: "#a06bff",
};

function EnemySprite({
  enemy,
  angle,
  camX,
  camY,
}: {
  enemy: Enemy;
  angle: number;
  camX: number;
  camY: number;
}) {
  const size = enemy.radius * 2;
  const color = enemy.hitFlash > 0 ? "#ffffff" : ENEMY_COLORS[enemy.kind];
  const opacity = enemy.hitFlash > 0 ? 0.9 : 1;

  if (enemy.kind === "runner") {
    return (
      <View
        style={{
          alignItems: "center",
          height: size * 2,
          justifyContent: "center",
          left: enemy.x - camX - size,
          opacity,
          position: "absolute",
          top: enemy.y - camY - size,
          transform: [{ rotate: `${angle + Math.PI / 2}rad` }],
          width: size * 2,
        }}
      >
        <View
          style={{
            borderBottomColor: color,
            borderBottomWidth: size * 1.6,
            borderLeftColor: "transparent",
            borderLeftWidth: size,
            borderRightColor: "transparent",
            borderRightWidth: size,
            height: 0,
            width: 0,
          }}
        />
      </View>
    );
  }

  if (enemy.kind === "tank") {
    const outer = size * 1.44;
    return (
      <View
        style={{
          alignItems: "center",
          height: outer,
          justifyContent: "center",
          left: enemy.x - camX - outer / 2,
          opacity,
          position: "absolute",
          top: enemy.y - camY - outer / 2,
          width: outer,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            borderColor: "#6b2fd6",
            borderRadius: size * 0.12,
            borderWidth: size * 0.12,
            height: size,
            transform: [{ rotate: `${angle}rad` }],
            width: size,
          }}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.22)",
              borderRadius: size * 0.08,
              flex: 1,
              margin: size * 0.22,
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: color,
        borderRadius: enemy.radius,
        height: size,
        justifyContent: "center",
        left: enemy.x - camX - enemy.radius,
        opacity,
        position: "absolute",
        top: enemy.y - camY - enemy.radius,
        transform: [{ rotate: `${angle}rad` }],
        width: size,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: Math.max(2, size * 0.1),
          marginBottom: size * 0.08,
        }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: size * 0.08,
            height: size * 0.32,
            width: size * 0.18,
          }}
        />
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: size * 0.08,
            height: size * 0.32,
            width: size * 0.18,
          }}
        />
      </View>
    </View>
  );
}

const FILL: ViewStyle = {
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0,
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function GameScreen({ onFinish }: Props) {
  const { width, height } = useWindowDimensions();

  const gameRef = useRef<GameState>(createGame(width, height));
  const phaseRef = useRef<Phase>("playing");
  const targetRef = useRef<Vec | null>(null);
  const reviveAvailableRef = useRef(true);
  const reviveUsedRef = useRef(false);

  const [, setTick] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [choices, setChoices] = useState<Upgrade[]>([]);
  const [reviveAvailable, setReviveAvailable] = useState(true);
  const [reviving, setReviving] = useState(false);
  const [adError, setAdError] = useState("");
  const [finalStats, setFinalStats] = useState<SessionResult>({
    score: 0,
    coins: 0,
    level: 1,
    kills: 0,
    time: 0,
    revived: false,
  });

  const setTargetFromEvent = (event: GestureResponderEvent) => {
    if (phaseRef.current !== "playing") {
      return;
    }
    targetRef.current = {
      x: event.nativeEvent.locationX + gameRef.current.camX,
      y: event.nativeEvent.locationY + gameRef.current.camY,
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: setTargetFromEvent,
      onPanResponderMove: setTargetFromEvent,
    }),
  ).current;

  const handleEvent = (event: GameEvent) => {
    const game = gameRef.current;

    if (event.type === "levelup") {
      phaseRef.current = "levelup";
      setPhase("levelup");
      setChoices(pickUpgradeChoices(game));
    } else if (event.type === "gameover") {
      phaseRef.current = "gameover";
      setPhase("gameover");
      setFinalStats({
        score: scoreOf(game),
        coins: game.coins,
        level: game.level,
        kills: game.kills,
        time: game.time,
        revived: false,
      });
    }
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      const game = gameRef.current;

      if (phaseRef.current === "playing") {
        const events = updateGame(game, dt, targetRef.current, null);

        for (const event of events) {
          handleEvent(event);
        }
      }

      setTick((tick) => tick + 1);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, []);

  const handlePickUpgrade = (upgrade: Upgrade) => {
    const game = gameRef.current;
    applyUpgrade(game, upgrade.id);
    phaseRef.current = "playing";
    setPhase("playing");
    setAdError("");
  };

  const handleRevive = async () => {
    if (reviving) {
      return;
    }
    setReviving(true);
    setAdError("");

    const rewarded = await showRewardedAd();
    setReviving(false);

    if (!rewarded) {
      setAdError("No se pudo reproducir el anuncio. Reintenta.");
      return;
    }

    revivePlayer(gameRef.current);
    reviveAvailableRef.current = false;
    reviveUsedRef.current = true;
    setReviveAvailable(false);
    phaseRef.current = "playing";
    setPhase("playing");
  };

  const finish = (revived: boolean) => {
    const game = gameRef.current;
    onFinish({
      score: scoreOf(game),
      coins: game.coins,
      level: game.level,
      kills: game.kills,
      time: game.time,
      revived,
    });
  };

  const game = gameRef.current;
  const player = game.player;
  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const xpRatio = Math.max(0, Math.min(1, game.xp / game.xpToNext));
  const playerBlink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;

  const shakeStyle = {
    transform: [
      { translateX: Math.sin(game.time * 90) * game.shake },
      { translateY: Math.cos(game.time * 61) * game.shake },
    ],
  };

  return (
    <View style={styles.screen} {...panResponder.panHandlers}>
      <StatusBar style="light" />

      <View style={styles.playfield}>
        <View style={[styles.entities, shakeStyle]} pointerEvents="none">
          {(() => {
            const TILE = 80;
            const camX = game.camX;
            const camY = game.camY;
            const firstCol = Math.max(0, Math.floor(camX / TILE));
            const firstRow = Math.max(0, Math.floor(camY / TILE));
            const lastCol = Math.min(
              Math.floor(game.worldWidth / TILE),
              Math.ceil((camX + width) / TILE),
            );
            const lastRow = Math.min(
              Math.floor(game.worldHeight / TILE),
              Math.ceil((camY + height) / TILE),
            );
            const tiles: React.ReactNode[] = [];
            for (let i = firstCol; i <= lastCol; i++) {
              for (let j = firstRow; j <= lastRow; j++) {
                tiles.push(
                  <View
                    key={`t${i}-${j}`}
                    style={{
                      backgroundColor: (i + j) % 2 === 0 ? "#10152a" : "#0c1021",
                      borderColor: "rgba(255,255,255,0.035)",
                      borderWidth: 0.5,
                      height: TILE,
                      left: i * TILE - camX,
                      position: "absolute",
                      top: j * TILE - camY,
                      width: TILE,
                    }}
                  />,
                );
              }
            }
            return tiles;
          })()}

          {game.bullets.map((bullet) => (
            <View
              key={bullet.id}
              style={[
                styles.bullet,
                {
                  left: bullet.x - game.camX - bullet.radius,
                  top: bullet.y - game.camY - bullet.radius,
                  width: bullet.radius * 2,
                  height: bullet.radius * 2,
                  borderRadius: bullet.radius,
                },
              ]}
            />
          ))}

          {game.gems.map((gem) => (
            <View
              key={gem.id}
              style={[
                styles.gem,
                {
                  left: gem.x - game.camX - 6,
                  top: gem.y - game.camY - 6,
                },
              ]}
            />
          ))}

          {game.enemies.map((enemy) => (
            <View key={enemy.id}>
              <EnemySprite
                enemy={enemy}
                angle={Math.atan2(player.y - enemy.y, player.x - enemy.x)}
                camX={game.camX}
                camY={game.camY}
              />
              {enemy.hp < enemy.maxHp && (
                <View
                  style={{
                    left: enemy.x - game.camX - enemy.radius,
                    top: enemy.y - game.camY - enemy.radius - 7,
                    width: enemy.radius * 2,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: "rgba(255,255,255,0.25)",
                  }}
                >
                  <View
                    style={{
                      width: (enemy.hp / enemy.maxHp) * enemy.radius * 2,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: "#56f0c4",
                    }}
                  />
                </View>
              )}
            </View>
          ))}

          <View
            style={[
              styles.player,
              playerBlink && styles.playerBlink,
              {
                left: player.x - game.camX - player.radius,
                top: player.y - game.camY - player.radius,
                width: player.radius * 2,
                height: player.radius * 2,
                borderRadius: player.radius,
              },
            ]}
          >
            <View
              style={[
                styles.playerBarrel,
                {
                  transform: [
                    {
                      rotate: `${Math.atan2(game.lastAim.y, game.lastAim.x)}rad`,
                    },
                  ],
                },
              ]}
            />
            <View style={styles.playerCore} />
          </View>
        </View>

        <View style={styles.hud} pointerEvents="none">
          <View style={styles.hudTop}>
            <View style={styles.hudBars}>
              <View style={styles.hpBarTrack}>
                <View style={[styles.hpBarFill, { width: `${hpRatio * 100}%` }]} />
              </View>
              <Text style={styles.hpText}>
                {Math.ceil(player.hp)}/{Math.ceil(player.maxHp)}
              </Text>
              <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${xpRatio * 100}%` }]} />
              </View>
            </View>

            <View style={styles.hudStats}>
              <Text style={styles.hudLevel}>NIV {game.level}</Text>
              <Text style={styles.hudTime}>{formatTime(game.time)}</Text>
              <Text style={styles.hudKills}>☠ {game.kills}</Text>
            </View>
          </View>

          <View style={styles.hudBottom}>
            <Text style={styles.hudCoins}>🪙 {game.coins}</Text>
          </View>
        </View>

        <Pressable style={styles.quitButton} onPress={() => finish(reviveUsedRef.current)}>
          <Text style={styles.quitButtonText}>Salir</Text>
        </Pressable>
      </View>

      {phase === "levelup" && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>NIVEL {game.level}</Text>
          <Text style={styles.overlaySubtitle}>Elige una mejora</Text>
          <View style={styles.choices}>
            {choices.map((upgrade) => (
              <Pressable
                key={upgrade.id}
                style={styles.choice}
                onPress={() => handlePickUpgrade(upgrade)}
              >
                <Text style={styles.choiceLabel}>{upgrade.label}</Text>
                <Text style={styles.choiceDescription}>{upgrade.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === "gameover" && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverTitle}>HAS CAIDO</Text>
          <View style={styles.statsCard}>
            <StatRow label="Supervivencia" value={formatTime(finalStats.time)} />
            <StatRow label="Nivel" value={`${finalStats.level}`} />
            <StatRow label="Enemigos" value={`${finalStats.kills}`} />
            <StatRow label="Puntaje" value={`${finalStats.score}`} />
            <StatRow label="Monedas ganadas" value={`+${finalStats.coins}`} />
          </View>

          {reviveAvailable ? (
            <Pressable
              style={[styles.reviveButton, reviving && styles.buttonDisabled]}
              onPress={handleRevive}
              disabled={reviving}
            >
              <Text style={styles.reviveButtonText}>
                {reviving ? "Reproduciendo anuncio..." : "🎬 REVIVE (anuncio)"}
              </Text>
            </Pressable>
          ) : null}

          {adError ? <Text style={styles.adError}>{adError}</Text> : null}

          <Pressable
            style={styles.finishButton}
            onPress={() => finish(reviveUsedRef.current)}
          >
            <Text style={styles.finishButtonText}>TERMINAR</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0e17",
  },
  playfield: {
    ...FILL,
    overflow: "hidden",
  },
  entities: {
    ...FILL,
  },
  bullet: {
    position: "absolute",
    backgroundColor: "#ffd166",
  },
  gem: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "#5eead4",
    transform: [{ rotate: "45deg" }],
  },
  player: {
    position: "absolute",
    backgroundColor: "#4da3ff",
    borderColor: "#cfe3ff",
    borderWidth: 3,
  },
  playerBarrel: {
    backgroundColor: "#1d62b8",
    borderRadius: 3,
    height: 7,
    left: "43%",
    position: "absolute",
    top: "50%",
    marginTop: -3.5,
    width: 21,
  },
  playerCore: {
    backgroundColor: "#eaf2ff",
    borderRadius: 5,
    height: 10,
    left: "50%",
    marginLeft: -5,
    marginTop: -5,
    position: "absolute",
    top: "50%",
    width: 10,
  },
  playerBlink: {
    opacity: 0.35,
  },
  hud: {
    ...FILL,
    padding: 14,
  },
  hudTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  hudBars: {
    flex: 1,
    gap: 6,
  },
  hpBarTrack: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 5,
    height: 12,
    overflow: "hidden",
  },
  hpBarFill: {
    backgroundColor: "#56f0c4",
    height: 12,
  },
  hpText: {
    color: "#e9ecf5",
    fontSize: 12,
  },
  xpBarTrack: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    height: 5,
    overflow: "hidden",
  },
  xpBarFill: {
    backgroundColor: "#ffd166",
    height: 5,
  },
  hudStats: {
    alignItems: "flex-end",
    gap: 2,
  },
  hudLevel: {
    color: "#ffd166",
    fontSize: 16,
    fontWeight: "900",
  },
  hudTime: {
    color: "#dde2ee",
    fontSize: 14,
    fontWeight: "700",
  },
  hudKills: {
    color: "#9aa3b8",
    fontSize: 13,
  },
  hudBottom: {
    bottom: 14,
    left: 14,
    position: "absolute",
  },
  hudCoins: {
    color: "#ffd166",
    fontSize: 15,
    fontWeight: "800",
  },
  quitButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    right: 14,
    top: 62,
  },
  quitButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  overlay: {
    ...FILL,
    alignItems: "center",
    backgroundColor: "rgba(6,8,14,0.86)",
    justifyContent: "center",
    padding: 24,
  },
  overlayTitle: {
    color: "#ffd166",
    fontSize: 40,
    fontWeight: "900",
  },
  overlaySubtitle: {
    color: "#9aa3b8",
    fontSize: 16,
    marginBottom: 24,
    marginTop: 6,
  },
  choices: {
    gap: 12,
    width: "100%",
  },
  choice: {
    backgroundColor: "#12182a",
    borderColor: "#2a3552",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  choiceLabel: {
    color: "#ffd166",
    fontSize: 18,
    fontWeight: "900",
  },
  choiceDescription: {
    color: "#c3c9d9",
    fontSize: 14,
    marginTop: 4,
  },
  gameOverTitle: {
    color: "#ff5d73",
    fontSize: 38,
    fontWeight: "900",
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: "#12182a",
    borderColor: "#2a3552",
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 22,
    padding: 18,
    width: "100%",
  },
  statRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "#8b93a7",
    fontSize: 14,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  reviveButton: {
    alignItems: "center",
    backgroundColor: "#ffd166",
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 54,
    width: "100%",
  },
  reviveButtonText: {
    color: "#0b0e17",
    fontSize: 16,
    fontWeight: "900",
  },
  finishButton: {
    alignItems: "center",
    backgroundColor: "#232c45",
    borderRadius: 14,
    justifyContent: "center",
    marginTop: 12,
    minHeight: 50,
    width: "100%",
  },
  finishButtonText: {
    color: "#c3c9d9",
    fontSize: 15,
    fontWeight: "800",
  },
  adError: {
    color: "#ff8f9e",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});