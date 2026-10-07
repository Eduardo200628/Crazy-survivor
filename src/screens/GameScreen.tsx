import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  Image,
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
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CHALLENGE_GEM_MULTIPLIER,
  characterById,
  stageById,
  type CharacterId,
  type StageId,
  type WeaponId,
} from "../catalog";
import {
  DASH_DURATION,
  applyUpgrade,
  createGame,
  dashPlayer,
  pickUpgradeChoices,
  revivePlayer,
  scoreOf,
  updateGame,
  type Enemy,
  type EnemyKind,
  type EnemyShot,
  type GameEvent,
  type GameState,
  type Orbital,
  type Pickup,
  type Vec,
} from "../engine";
import type { Upgrade } from "../upgrades";
import type { PerkLevels } from "../perks";
import { showRewardedAd } from "../ads";
import {
  DROP_SPRITES,
  ENEMY_SPRITE_SIZES,
  ENEMY_SPRITES,
  PICKUP_SPRITES,
  PLAYER_FACING_OFFSET,
  PLAYER_SPRITE,
  PLAYER_SPRITE_SIZE,
} from "../sprites";
import { initAudio, play, setAppActive, stopMusic } from "../audio";

export type SessionResult = {
  score: number;
  coins: number;
  gems: number;
  level: number;
  kills: number;
  time: number;
  revived: boolean;
  bossKills: number;
  bestCombo: number;
  cleared: boolean;
  stageId: StageId;
  challenge: boolean;
};

type Phase = "playing" | "levelup" | "gameover" | "cleared" | "paused";

const RENDER_INTERVAL_MS = 1000 / 40;

type Floater = {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

type Props = {
  onFinish: (session: SessionResult) => void;
  perks: PerkLevels;
  stageId: StageId;
  weaponId: WeaponId;
  characterId: CharacterId;
  challenge: boolean;
};

const ENEMY_COLORS: Record<EnemyKind, string> = {
  walker: "#e5484d",
  runner: "#ff9f43",
  tank: "#a06bff",
  spitter: "#ff4dd2",
  boss: "#ff7f32",
};

function EnemySprite({
  enemy,
  angle,
  camX,
  camY,
  time,
}: {
  enemy: Enemy;
  angle: number;
  camX: number;
  camY: number;
  time: number;
}) {
  const size = enemy.radius * 2;
  const color = enemy.hitFlash > 0 ? "#ffffff" : ENEMY_COLORS[enemy.kind];
  const opacity = enemy.hitFlash > 0 ? 0.9 : 1;
  const sprite = ENEMY_SPRITES[enemy.kind];
  const spriteSize = ENEMY_SPRITE_SIZES[enemy.kind];
  const motionSpeed = enemy.kind === "runner" ? 10 : enemy.kind === "tank" ? 4 : 6;
  const motionAmount = enemy.kind === "runner" ? 2.2 : enemy.kind === "tank" ? 0.8 : 1.2;
  const bob = Math.sin(time * motionSpeed + enemy.id) * motionAmount;
  const pulse = 1 + Math.cos(time * 3 + enemy.id) * (enemy.kind === "tank" ? 0.008 : 0.015);

  if (sprite && spriteSize) {
    return (
      <Image
        source={sprite}
        resizeMode="contain"
        style={{
          height: spriteSize.height,
          left: enemy.x - camX - spriteSize.width / 2,
          opacity,
          position: "absolute",
          top: enemy.y - camY - spriteSize.height / 2,
          transform: [{ translateY: bob }, { scale: pulse }],
          width: spriteSize.width,
        }}
      />
    );
  }

  if (enemy.kind === "spitter") {
    const size = enemy.radius * 2;
    return (
      <View
        style={{
          alignItems: "center",
          backgroundColor: color,
          height: size,
          justifyContent: "center",
          left: enemy.x - camX - enemy.radius,
          opacity,
          position: "absolute",
          top: enemy.y - camY - enemy.radius,
          transform: [{ rotate: "45deg" }],
          width: size,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: "#7a0f99",
            borderRadius: size * 0.12,
            height: size * 0.5,
            justifyContent: "center",
            transform: [{ rotate: "-45deg" }],
            width: size * 0.5,
          }}
        >
          <View style={{ backgroundColor: "#ffffff", borderRadius: 4, height: 6, width: 6 }} />
        </View>
      </View>
    );
  }

  if (enemy.kind === "boss") {
    const outer = size * 1.7;
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
            borderColor: "#5c1c00",
            borderRadius: size * 0.12,
            borderWidth: size * 0.12,
            height: size,
            transform: [{ rotate: `${angle}rad` }],
            width: size,
          }}
        >
          <View
            style={{
              borderColor: "#ffd166",
              borderRadius: 4,
              borderWidth: 3,
              flex: 1,
              margin: size * 0.18,
            }}
          />
        </View>
        <View
          style={{
            borderBottomColor: "#ffd166",
            borderBottomWidth: size * 0.3,
            borderLeftColor: "transparent",
            borderLeftWidth: size * 0.22,
            borderRightColor: "transparent",
            borderRightWidth: size * 0.22,
            height: 0,
            marginTop: size * 0.12,
            width: 0,
          }}
        />
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

function buildResult(game: GameState, revived: boolean, challenge: boolean): SessionResult {
  const baseGems = game.gemsCollected + (game.cleared ? game.stage.rewardGems : 0);
  return {
    score: scoreOf(game),
    coins: game.coins + (game.cleared ? game.stage.rewardCoins : 0),
    gems: Math.round(baseGems * (challenge ? CHALLENGE_GEM_MULTIPLIER : 1)),
    level: game.level,
    kills: game.kills,
    time: game.time,
    revived,
    bossKills: game.bossKills,
    bestCombo: game.bestCombo,
    cleared: game.cleared,
    stageId: game.stage.id,
    challenge,
  };
}

export function GameScreen({ onFinish, perks, stageId, weaponId, characterId, challenge }: Props) {
  const { width, height } = useWindowDimensions();

  const stage = stageById(stageId);
  const character = characterById(characterId);

  const gameRef = useRef<GameState>(
    createGame(width, height, perks, { stageId, weaponId, characterId }),
  );
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
  const [banner, setBanner] = useState("");
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [finalStats, setFinalStats] = useState<SessionResult>({
    score: 0,
    coins: 0,
    gems: 0,
    level: 1,
    kills: 0,
    time: 0,
    revived: false,
    bossKills: 0,
    bestCombo: 0,
    cleared: false,
    stageId,
    challenge,
  });

  const floatersRef = useRef<Floater[]>([]);
  const floaterIdRef = useRef(0);
  const flashRef = useRef(new Animated.Value(0)).current;
  const iFramesRef = useRef(new Animated.Value(0)).current;
  const pausedRef = useRef(false);
  const lastRenderRef = useRef(0);

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

  const addFloater = useCallback(
    (x: number, y: number, text: string, color: string, size = 15) => {
      floaterIdRef.current += 1;
      const list = floatersRef.current;
      if (list.length > 26) {
        list.shift();
      }
      list.push({
        id: floaterIdRef.current,
        x,
        y,
        text,
        life: 0.72,
        maxLife: 0.72,
        color,
        size,
      });
    },
    [],
  );

  const handleEvent = useCallback(
    (event: GameEvent) => {
      const game = gameRef.current;

      if (event.type === "levelup") {
        phaseRef.current = "levelup";
        setPhase("levelup");
        setChoices(pickUpgradeChoices(game));
        play("levelup");
      } else if (event.type === "gameover") {
        phaseRef.current = "gameover";
        setPhase("gameover");
        setFinalStats(buildResult(game, false, challenge));
        stopMusic();
        play("defeat");
      } else if (event.type === "stageclear") {
        phaseRef.current = "cleared";
        setPhase("cleared");
        setFinalStats(buildResult(game, false, challenge));
        play("victory");
      } else if (event.type === "boss") {
        setBanner("⚠️ JEFE EN LA ZONA");
        play("boss");
      } else if (event.type === "shoot") {
        play(game.weapon.count > 1 ? "shotgun" : "shot");
      } else if (event.type === "impact") {
        play("hit");
        if (event.crit || event.killed) {
          addFloater(
            event.x,
            event.y,
            `${event.crit ? "!" : ""}${event.damage}`,
            event.crit ? "#ffd166" : "#ffffff",
            event.crit ? 20 : 15,
          );
        }
      } else if (event.type === "kill") {
        play("kill");
      } else if (event.type === "nova") {
        play("nova");
      } else if (event.type === "hit") {
        play("hurt");
        flashRef.setValue(1);
        Animated.timing(flashRef, {
          duration: 280,
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else if (event.type === "pickup") {
        play(event.kind === "gems" ? "gem" : event.kind === "heal" ? "levelup" : "coin");
      }
    },
    [addFloater, challenge, flashRef],
  );

  useEffect(() => {
    if (!banner) {
      return;
    }
    bannerTimerRef.current = setTimeout(() => setBanner(""), 2600);
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, [banner]);

  useEffect(() => {
    initAudio();

    const subscription = AppState.addEventListener("change", (next) => {
      const active = next === "active";
      void setAppActive(active);
      if (!active && phaseRef.current === "playing") {
        pausedRef.current = true;
        phaseRef.current = "paused";
        setPhase("paused");
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      const game = gameRef.current;

      if (phaseRef.current === "playing" && !pausedRef.current) {
        const events = updateGame(game, dt, targetRef.current, null);

        for (const event of events) {
          handleEvent(event);
        }

        if (game.player.invuln > 0) {
          iFramesRef.setValue(1);
        } else {
          iFramesRef.setValue(0);
        }

        const floaters = floatersRef.current;
        for (let i = floaters.length - 1; i >= 0; i--) {
          const floater = floaters[i];
          floater.life -= dt;
          floater.y -= 46 * dt;
          if (floater.life <= 0) {
            floaters.splice(i, 1);
          }
        }

        if (now - lastRenderRef.current >= RENDER_INTERVAL_MS) {
          lastRenderRef.current = now;
          setTick((tick) => tick + 1);
        }
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [handleEvent, iFramesRef]);

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

  const handleDash = () => {
    if (phaseRef.current !== "playing" || pausedRef.current) {
      return;
    }
    if (dashPlayer(gameRef.current)) {
      play("dash");
    }
  };

  const togglePause = () => {
    if (phaseRef.current !== "playing" && phaseRef.current !== "paused") {
      return;
    }
    const next = phaseRef.current === "paused" ? "playing" : "paused";
    pausedRef.current = next === "paused";
    phaseRef.current = next;
    setPhase(next);
    play("click");
  };

  const finish = (revived: boolean) => {
    onFinish(buildResult(gameRef.current, revived, challenge));
  };

  const game = gameRef.current;
  const player = game.player;
  const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
  const xpRatio = Math.max(0, Math.min(1, game.xp / game.xpToNext));
  const playerBlink = player.invuln > 0 && Math.floor(player.invuln * 12) % 2 === 0;
  const playerBob = Math.sin(game.time * 7) * 1.2;
  const playerPulse = 1 + Math.sin(game.time * 4) * 0.02;
  const playerFacing = player.dashTime > 0 ? player.dashDir : game.moveDir;
  const playerAngle = Math.atan2(playerFacing.y, playerFacing.x) + PLAYER_FACING_OFFSET;

  const viewMargin = 60;
  const viewLeft = game.camX - viewMargin;
  const viewRight = game.camX + width + viewMargin;
  const viewTop = game.camY - viewMargin;
  const viewBottom = game.camY + height + viewMargin;
  const onScreen = (x: number, y: number) =>
    x >= viewLeft && x <= viewRight && y >= viewTop && y <= viewBottom;
  const dashReady = player.dashCooldown <= 0;
  const dashRatio = Math.max(0, Math.min(1, 1 - player.dashCooldown / DASH_DURATION));
  const comboVisible = game.combo >= 2 && game.comboTimer > 0;
  const comboRatio = Math.max(0, Math.min(1, game.comboTimer / 2.4));

  const shakeStyle = {
    transform: [
      { translateX: Math.sin(game.time * 90) * game.shake },
      { translateY: Math.cos(game.time * 61) * game.shake },
    ],
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.playfield} {...panResponder.panHandlers}>
        <View style={[styles.entities, shakeStyle]} pointerEvents="none">
          <View
            style={{
              backgroundColor: "rgba(94,234,212,0.05)",
              borderColor: "rgba(94,234,212,0.28)",
              borderRadius: player.vision,
              borderWidth: 1,
              height: player.vision * 2,
              left: player.x - game.camX - player.vision,
              position: "absolute",
              top: player.y - game.camY - player.vision,
              width: player.vision * 2,
            }}
          />
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
                  backgroundColor: game.weapon.color,
                  left: bullet.x - game.camX - bullet.radius,
                  top: bullet.y - game.camY - bullet.radius,
                  width: bullet.radius * 2,
                  height: bullet.radius * 2,
                  borderRadius: bullet.radius,
                },
              ]}
            />
          ))}

          {game.enemyShots.map((shot: EnemyShot) => (
            <View
              key={shot.id}
              style={[
                styles.enemyShot,
                {
                  left: shot.x - game.camX - shot.radius,
                  top: shot.y - game.camY - shot.radius,
                  width: shot.radius * 2,
                  height: shot.radius * 2,
                  borderRadius: shot.radius,
                },
              ]}
            />
          ))}

          {game.pickups
            .filter((pickup: Pickup) => onScreen(pickup.x, pickup.y))
            .map((pickup: Pickup) => {
            const pulse = 1 + 0.15 * Math.sin(game.time * 5 + pickup.id);
            return (
              <Image
                key={pickup.id}
                source={PICKUP_SPRITES[pickup.kind] ?? PICKUP_SPRITES.coins}
                style={[
                  styles.pickupSprite,
                  {
                    left: pickup.x - game.camX - 12,
                    top: pickup.y - game.camY - 12,
                    transform: [{ scale: pulse }],
                  },
                ]}
              />
            );
          })}

          {game.drops
            .filter((drop) => onScreen(drop.x, drop.y))
            .map((drop) => {
            const isGem = drop.kind === "gem";
            return (
              <Image
                key={drop.id}
                source={DROP_SPRITES[drop.kind]}
                style={[
                  styles.dropSprite,
                  isGem ? styles.dropGem : null,
                  {
                    left: drop.x - game.camX - (isGem ? 9 : 7),
                    top: drop.y - game.camY - (isGem ? 9 : 7),
                  },
                ]}
              />
            );
          })}

          {game.enemies
            .filter((enemy) => onScreen(enemy.x, enemy.y))
            .map((enemy) => {
            const isTank = enemy.kind === "tank";
            const healthBarWidth = isTank ? enemy.radius * 2.4 : enemy.radius * 2;
            const healthBarTop = enemy.y - game.camY - (isTank ? enemy.radius * 1.44 + 7 : enemy.radius + 7);

            return (
              <View key={enemy.id}>
                <EnemySprite
                  enemy={enemy}
                  angle={Math.atan2(player.y - enemy.y, player.x - enemy.x)}
                  camX={game.camX}
                  camY={game.camY}
                  time={game.time}
                />
                {isTank ? (
                  <Text
                    style={[
                      styles.enemyHpText,
                      {
                        left: enemy.x - game.camX - healthBarWidth / 2,
                        top: healthBarTop - 13,
                        width: healthBarWidth,
                      },
                    ]}
                  >
                    VIDA {Math.ceil(enemy.hp)}
                  </Text>
                ) : null}
                {(isTank || enemy.hp < enemy.maxHp) && (
                  <View
                    style={{
                      left: enemy.x - game.camX - healthBarWidth / 2,
                      top: healthBarTop,
                      width: healthBarWidth,
                      height: isTank ? 5 : 3,
                      borderRadius: isTank ? 2.5 : 1.5,
                      backgroundColor: "rgba(255,255,255,0.25)",
                    }}
                  >
                    <View
                      style={{
                        width: (enemy.hp / enemy.maxHp) * healthBarWidth,
                        height: isTank ? 5 : 3,
                        borderRadius: isTank ? 2.5 : 1.5,
                        backgroundColor: isTank ? "#ffd166" : "#56f0c4",
                      }}
                    />
                  </View>
                )}
              </View>
            );
          })}

          {game.afterimages.map((ghost) => (
            <View
              key={ghost.id}
              style={{
                backgroundColor: character.accent,
                borderRadius: 18,
                height: 26,
                left: ghost.x - game.camX - 13,
                opacity: Math.min(0.5, ghost.life) * 0.7,
                position: "absolute",
                top: ghost.y - game.camY - 13,
                transform: [{ rotate: `${ghost.angle}rad` }, { scaleX: 1.5 }],
                width: 26,
              }}
            />
          ))}

          <View
            style={{
              backgroundColor: character.accent,
              borderRadius: 26,
              height: 52,
              left: player.x - game.camX - 26,
              opacity: 0.22,
              position: "absolute",
              top: player.y - game.camY - 26,
              width: 52,
            }}
          />

          {game.afterimages.map((ghost) => (
            <View
              key={ghost.id}
              style={{
                backgroundColor: character.accent,
                borderRadius: 18,
                height: 26,
                left: ghost.x - game.camX - 13,
                opacity: Math.min(0.5, ghost.life) * 0.7,
                position: "absolute",
                top: ghost.y - game.camY - 13,
                transform: [{ rotate: `${ghost.angle}rad` }, { scaleX: 1.5 }],
                width: 26,
              }}
            />
          ))}

          <Image
            source={PLAYER_SPRITE}
            resizeMode="contain"
            style={[
              styles.playerSprite,
              playerBlink && styles.playerBlink,
              {
                left: player.x - game.camX - PLAYER_SPRITE_SIZE.width / 2,
                top: player.y - game.camY - PLAYER_SPRITE_SIZE.height / 2,
                height: PLAYER_SPRITE_SIZE.height,
                transform: [
                  { translateY: playerBob },
                  { scale: playerPulse },
                  { rotate: `${playerAngle}rad` },
                ],
                width: PLAYER_SPRITE_SIZE.width,
              },
            ]}
          />

          {game.orbitals.map((orbital: Orbital) => {
            const ox = player.x + Math.cos(orbital.angle) * orbital.radius;
            const oy = player.y + Math.sin(orbital.angle) * orbital.radius;
            return (
              <View
                key={orbital.id}
                style={{
                  alignItems: "center",
                  backgroundColor: "#ffd166",
                  borderRadius: 3,
                  height: 12,
                  justifyContent: "center",
                  left: ox - game.camX - 6,
                  position: "absolute",
                  top: oy - game.camY - 6,
                  transform: [{ rotate: `${orbital.angle + Math.PI / 2}rad` }],
                  width: 12,
                }}
              >
                <View style={{ backgroundColor: "#0b0e17", borderRadius: 2, height: 5, width: 5 }} />
              </View>
            );
          })}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.hurtFlash,
            { opacity: flashRef.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
          ]}
        />

        <View pointerEvents="none" style={styles.floaterLayer}>
          {floatersRef.current.map((floater) => (
            <Text
              key={floater.id}
              style={{
                color: floater.color,
                fontSize: floater.size,
                fontWeight: "900",
                left: floater.x - game.camX - 18,
                opacity: Math.min(1, (floater.life / floater.maxLife) * 1.6),
                position: "absolute",
                textAlign: "center",
                textShadowColor: "rgba(0,0,0,0.85)",
                textShadowOffset: { height: 1, width: 0 },
                textShadowRadius: 3,
                top: floater.y - game.camY,
                width: 36,
              }}
            >
              {floater.text}
            </Text>
          ))}
        </View>

        {comboVisible ? (
          <View pointerEvents="none" style={styles.comboBox}>
            <Text style={styles.comboText}>x{game.combo}</Text>
            <Text style={styles.comboLabel}>COMBO</Text>
            <View style={styles.comboTrack}>
              <View style={[styles.comboFill, { width: `${comboRatio * 100}%` }]} />
            </View>
          </View>
        ) : null}

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
              {challenge ? (
                <View style={styles.challengeBadge}>
                  <Text style={styles.challengeBadgeText}>
                    DESAFIO x{CHALLENGE_GEM_MULTIPLIER}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.hudStage} numberOfLines={1}>
                {stage.name.toUpperCase()}
              </Text>
              <Text style={styles.hudLevel}>NIV {game.level}</Text>
              <Text style={styles.hudTime}>{formatTime(game.time)}</Text>
              <Text style={styles.hudKills}>☠ {game.kills}</Text>
            </View>
          </View>

          <View style={styles.hudBottom}>
            <View style={styles.hudRow}>
              <Text style={styles.hudCoins}>🪙 {game.coins}</Text>
              <Text style={styles.hudGems}>💎 {game.gemsCollected}</Text>
            </View>
          </View>
        </View>

        {banner ? (
          <View style={styles.banner} pointerEvents="none">
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        <Pressable style={styles.quitButton} onPress={() => finish(reviveUsedRef.current)}>
          <Text style={styles.quitButtonText}>Salir</Text>
        </Pressable>

        <Pressable
          onPress={togglePause}
          style={styles.pauseButton}
          disabled={phase !== "playing" && phase !== "paused"}
        >
          <Text style={styles.pauseButtonText}>{phase === "paused" ? "▶" : "❚❚"}</Text>
        </Pressable>

        {phase === "playing" || phase === "paused" ? (
          <Pressable onPress={handleDash} style={styles.dashButton}>
            <View style={styles.dashTrack}>
              <View
                style={[
                  styles.dashFill,
                  { height: `${dashRatio * 100}%`, opacity: dashReady ? 1 : 0.65 },
                ]}
              />
            </View>
            <Text style={styles.dashGlyph}>»</Text>
            <Text style={styles.dashLabel}>{dashReady ? "DASH" : player.dashCooldown.toFixed(1)}</Text>
          </Pressable>
        ) : null}
      </View>

      {phase === "paused" && (
        <View style={styles.overlay}>
          <Text style={styles.overlayTitle}>PAUSA</Text>
          <Text style={styles.overlaySubtitle}>
            {stage.name} · {formatTime(game.time)}
          </Text>
          <Pressable style={styles.finishButton} onPress={togglePause}>
            <Text style={styles.finishButtonText}>CONTINUAR</Text>
          </Pressable>
          <Pressable
            style={[styles.finishButton, styles.secondaryButton]}
            onPress={() => finish(reviveUsedRef.current)}
          >
            <Text style={styles.finishButtonText}>SALIR</Text>
          </Pressable>
        </View>
      )}

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

      {phase === "cleared" && (
        <View style={styles.overlay}>
          <Text style={styles.clearedTitle}>ZONA COMPLETADA</Text>
          <Text style={styles.overlaySubtitle}>{stage.name}</Text>
          <View style={styles.statsCard}>
            <StatRow label="Supervivencia" value={formatTime(finalStats.time)} />
            <StatRow label="Nivel" value={`${finalStats.level}`} />
            <StatRow label="Enemigos" value={`${finalStats.kills}`} />
            {finalStats.bossKills > 0 ? (
              <StatRow label="Jefes derrotados" value={`${finalStats.bossKills}`} />
            ) : null}
            {finalStats.bestCombo > 1 ? (
              <StatRow label="Mejor combo" value={`x${finalStats.bestCombo}`} />
            ) : null}
            <StatRow label="Puntaje" value={`${finalStats.score}`} />
            <StatRow label="Monedas ganadas" value={`+${finalStats.coins}`} />
            <StatRow label="Gemas ganadas" value={`+${finalStats.gems}`} />
          </View>

          <Pressable style={styles.finishButton} onPress={() => finish(false)}>
            <Text style={styles.finishButtonText}>VOLVER AL MENU</Text>
          </Pressable>
        </View>
      )}

      {phase === "gameover" && (
        <View style={styles.overlay}>
          <Text style={styles.gameOverTitle}>HAS CAIDO</Text>
          <View style={styles.statsCard}>
            <StatRow label="Supervivencia" value={formatTime(finalStats.time)} />
            <StatRow label="Nivel" value={`${finalStats.level}`} />
            <StatRow label="Enemigos" value={`${finalStats.kills}`} />
            {finalStats.bossKills > 0 ? (
              <StatRow label="Jefes derrotados" value={`${finalStats.bossKills}`} />
            ) : null}
            {finalStats.bestCombo > 1 ? (
              <StatRow label="Mejor combo" value={`x${finalStats.bestCombo}`} />
            ) : null}
            <StatRow label="Puntaje" value={`${finalStats.score}`} />
            <StatRow label="Monedas ganadas" value={`+${finalStats.coins}`} />
            <StatRow label="Gemas ganadas" value={`+${finalStats.gems}`} />
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
    </SafeAreaView>
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
  enemyShot: {
    position: "absolute",
    backgroundColor: "#ff5d73",
  },
  enemyHpText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    position: "absolute",
    textAlign: "center",
  },
  banner: {
    alignItems: "center",
    backgroundColor: "rgba(255,93,115,0.16)",
    borderColor: "#ff5d73",
    borderRadius: 12,
    borderWidth: 1,
    left: "25%",
    paddingVertical: 8,
    position: "absolute",
    right: "25%",
    top: 90,
  },
  bannerText: {
    color: "#ffd166",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pickupSprite: {
    position: "absolute",
    width: 24,
    height: 24,
  },
  dropSprite: {
    position: "absolute",
    width: 14,
    height: 14,
  },
  dropGem: {
    width: 18,
    height: 18,
  },
  playerSprite: {
    position: "absolute",
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
  challengeBadge: {
    alignSelf: "flex-end",
    backgroundColor: "#a06bff",
    borderRadius: 6,
    marginBottom: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  challengeBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  hudStage: {
    color: "#e9ecf5",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    maxWidth: 120,
    textAlign: "right",
  },
  hudBottom: {
    bottom: 14,
    left: 14,
    position: "absolute",
  },
  hudRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  hudCoins: {
    color: "#ffd166",
    fontSize: 15,
    fontWeight: "800",
  },
  hudGems: {
    color: "#5eead4",
    fontSize: 15,
    fontWeight: "800",
  },
  hurtFlash: {
    ...FILL,
    backgroundColor: "#ff2d55",
  },
  floaterLayer: {
    ...FILL,
  },
  comboBox: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: "22%",
  },
  comboText: {
    color: "#ffd166",
    fontSize: 34,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 6,
  },
  comboLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    opacity: 0.85,
  },
  comboTrack: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    height: 3,
    marginTop: 4,
    overflow: "hidden",
    width: 90,
  },
  comboFill: {
    backgroundColor: "#ffd166",
    height: 3,
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "rgba(11,14,23,0.7)",
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    left: 12,
    position: "absolute",
    top: 12,
    width: 40,
  },
  pauseButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  dashButton: {
    alignItems: "center",
    backgroundColor: "rgba(11,14,23,0.75)",
    borderColor: "#56f0c4",
    borderRadius: 34,
    borderWidth: 2,
    bottom: 26,
    height: 68,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    width: 68,
  },
  dashTrack: {
    ...FILL,
    borderRadius: 32,
    overflow: "hidden",
  },
  dashFill: {
    backgroundColor: "rgba(86,240,196,0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
  dashGlyph: {
    color: "#56f0c4",
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 28,
  },
  dashLabel: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    opacity: 0.9,
  },
  secondaryButton: {
    backgroundColor: "#2a3350",
    borderColor: "#1b2138",
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
  clearedTitle: {
    color: "#56f0c4",
    fontSize: 32,
    fontWeight: "900",
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
