import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDrag } from "react-use-gesture";
import { useSprings, animated } from "@react-spring/web";
import classNames from "classnames";
import styles from "./VideoGrid.module.css";
import useMeasure from "react-use-measure";
import moveArrItem from "lodash-move";
import { ReactComponent as MicIcon } from "./icons/Mic.svg";
import { ReactComponent as MuteMicIcon } from "./icons/MuteMic.svg";
import { ReactComponent as DisableVideoIcon } from "./icons/DisableVideo.svg";

function useIsMounted() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}

function isInside([x, y], targetTile) {
  const left = targetTile.x;
  const top = targetTile.y;
  const bottom = targetTile.y + targetTile.height;
  const right = targetTile.x + targetTile.width;

  if (x < left || x > right || y < top || y > bottom) {
    return false;
  }

  return true;
}

function getTilePositions(tileCount, gridBounds, presenterTileCount) {
  if (tileCount === 0) {
    return [];
  }

  if (tileCount > 12) {
    console.warn("Over 12 tiles is not currently supported");
  }

  if (presenterTileCount > 3) {
    console.warn("Over 3 presenters is not currently supported");
  }

  const gridWidth = gridBounds.width;
  const gridHeight = gridBounds.height;
  const gridAspectRatio = gridWidth / gridHeight;

  if (presenterTileCount) {
    const subGridTileCount = tileCount - presenterTileCount;

    let presenterGridWidth,
      presenterGridHeight,
      presenterColumnCount,
      presenterRowCount,
      presenterTileAspectRatio;

    let subGridWidth,
      subGridHeight,
      subGridOffsetLeft,
      subGridOffsetTop,
      subGridColumnCount,
      subGridRowCount,
      subGridTileAspectRatio;

    if (gridAspectRatio < 3 / 4) {
      // Phone
      presenterGridWidth = gridWidth;
      presenterColumnCount = 1;
      presenterRowCount = presenterTileCount;
      presenterTileAspectRatio = 16 / 9;
      subGridTileAspectRatio = 16 / 9;

      if (presenterTileCount > 2) {
        presenterColumnCount = 2;
        presenterRowCount = 2;
        presenterTileAspectRatio = 0;
      }

      if (subGridTileCount < 3) {
        if (presenterTileCount === 1) {
        }
        subGridColumnCount = presenterTileCount === 1 ? 1 : subGridTileCount;
        subGridRowCount = presenterTileCount === 1 ? subGridTileCount : 1;
        subGridTileAspectRatio = presenterTileCount === 1 ? 16 / 9 : 0;
      } else if (subGridTileCount < 5) {
        subGridColumnCount = 2;
        subGridRowCount = 2;
      } else if (subGridTileCount < 7) {
        subGridColumnCount = 2;
        subGridRowCount = 3;
      } else if (subGridTileCount < 10) {
        subGridColumnCount = 3;
        subGridRowCount = 3;
      } else {
        subGridColumnCount = 4;
        subGridRowCount = 3;
      }

      presenterGridHeight = Math.round(
        gridHeight *
          (1 -
            1 /
              Math.max(
                presenterRowCount + 2 - Math.max(subGridRowCount - 1, 0),
                2
              ))
      );

      subGridWidth = gridWidth;
      subGridHeight = gridHeight - presenterGridHeight;
      subGridOffsetTop = presenterGridHeight;
      subGridOffsetLeft = 0;
    } else if (gridAspectRatio < 1) {
      // Tablet
      presenterGridWidth = gridWidth;
      presenterColumnCount = 1;
      presenterRowCount = presenterTileCount;
      presenterTileAspectRatio = 16 / 9;
      subGridTileAspectRatio = 16 / 9;

      if (presenterTileCount > 2) {
        presenterColumnCount = 2;
        presenterRowCount = 2;
        presenterTileAspectRatio = 0;
      }

      if (subGridTileCount < 3) {
        if (presenterTileCount === 1) {
        }
        subGridColumnCount = presenterTileCount === 1 ? 1 : subGridTileCount;
        subGridRowCount = presenterTileCount === 1 ? subGridTileCount : 1;
        subGridTileAspectRatio = presenterTileCount === 1 ? 16 / 9 : 0;
      } else if (subGridTileCount < 5) {
        subGridColumnCount = 2;
        subGridRowCount = 2;
      } else if (subGridTileCount < 7) {
        subGridColumnCount = 2;
        subGridRowCount = 3;
      } else if (subGridTileCount < 10) {
        subGridColumnCount = 3;
        subGridRowCount = 3;
      } else {
        subGridColumnCount = 4;
        subGridRowCount = 3;
      }

      presenterGridHeight = Math.round(
        gridHeight *
          (1 -
            1 /
              Math.max(
                presenterRowCount + 2 - Math.max(subGridRowCount - 1, 0),
                2
              ))
      );

      subGridWidth = gridWidth;
      subGridHeight = gridHeight - presenterGridHeight;
      subGridOffsetTop = presenterGridHeight;
      subGridOffsetLeft = 0;
    } else if (gridAspectRatio < 17 / 9) {
      // Computer
      presenterGridWidth = gridWidth * (2 / 3);
      presenterGridHeight = gridHeight;
      presenterColumnCount = 1;
      presenterRowCount = presenterTileCount;
      presenterTileAspectRatio = 0;

      subGridWidth = gridWidth - presenterGridWidth;
      subGridHeight = gridHeight;
      subGridColumnCount = Math.ceil(subGridTileCount / 6);
      subGridRowCount = Math.ceil(subGridTileCount / subGridColumnCount);
      subGridOffsetTop = 0;
      subGridOffsetLeft = presenterGridWidth;
      subGridTileAspectRatio = 16 / 9;
    } else if (gridAspectRatio <= 32 / 9) {
      // Ultrawide
      presenterGridWidth = gridWidth * (2 / 3);
      presenterGridHeight = gridHeight;
      presenterColumnCount = 1;
      presenterRowCount = presenterTileCount;
      presenterTileAspectRatio = 16 / 9;

      subGridWidth = gridWidth - presenterGridWidth;
      subGridHeight = gridHeight;
      subGridColumnCount = Math.ceil(subGridTileCount / 4);
      subGridRowCount = Math.ceil(subGridTileCount / subGridColumnCount);
      subGridOffsetTop = 0;
      subGridOffsetLeft = presenterGridWidth;
      subGridTileAspectRatio = 16 / 9;
    } else {
      // Super Ultrawide
      presenterGridWidth = gridWidth * (2 / 3);
      presenterGridHeight = gridHeight;
      presenterColumnCount = 1;
      presenterRowCount = presenterTileCount;
      presenterTileAspectRatio = 16 / 9;

      subGridWidth = gridWidth - presenterGridWidth;
      subGridHeight = gridHeight;
      subGridColumnCount = Math.ceil(subGridTileCount / 3);
      subGridRowCount = Math.ceil(subGridTileCount / subGridColumnCount);
      subGridOffsetTop = 0;
      subGridOffsetLeft = presenterGridWidth;
      subGridTileAspectRatio = 16 / 9;
    }

    const presenterPositions = getSubGridPositions(
      presenterTileCount,
      presenterColumnCount,
      presenterRowCount,
      presenterTileAspectRatio,
      {
        width: presenterGridWidth,
        height: presenterGridHeight,
      }
    );

    const subGridPositions = getSubGridPositions(
      subGridTileCount,
      subGridColumnCount,
      subGridRowCount,
      subGridTileAspectRatio,
      {
        width: subGridWidth,
        height: subGridHeight,
        offsetTop: subGridOffsetTop,
        offsetLeft: subGridOffsetLeft,
      }
    );

    return [...presenterPositions, ...subGridPositions];
  } else {
    let columnCount, rowCount;
    let tileAspectRatio = 16 / 9;

    if (gridAspectRatio < 3 / 4) {
      // Phone
      if (tileCount === 1) {
        columnCount = 1;
        rowCount = 1;
        tileAspectRatio = 0;
      } else if (tileCount <= 4) {
        columnCount = 1;
        rowCount = tileCount;
      } else if (tileCount <= 12) {
        columnCount = 2;
        rowCount = Math.ceil(tileCount / columnCount);
        tileAspectRatio = 0;
      } else {
        // Unsupported
        columnCount = 3;
        rowCount = Math.ceil(tileCount / columnCount);
        tileAspectRatio = 1;
      }
    } else if (gridAspectRatio < 1) {
      // Tablet
      if (tileCount === 1) {
        columnCount = 1;
        rowCount = 1;
        tileAspectRatio = 0;
      } else if (tileCount <= 4) {
        columnCount = 1;
        rowCount = tileCount;
      } else if (tileCount <= 12) {
        columnCount = 2;
        rowCount = Math.ceil(tileCount / columnCount);
      } else {
        // Unsupported
        columnCount = 3;
        rowCount = Math.ceil(tileCount / columnCount);
        tileAspectRatio = 1;
      }
    } else if (gridAspectRatio < 17 / 9) {
      // Computer
      if (tileCount === 1) {
        columnCount = 1;
        rowCount = 1;
      } else if (tileCount === 2) {
        columnCount = 2;
        rowCount = 1;
      } else if (tileCount <= 4) {
        columnCount = 2;
        rowCount = 2;
      } else if (tileCount <= 6) {
        columnCount = 3;
        rowCount = 2;
      } else if (tileCount <= 8) {
        columnCount = 4;
        rowCount = 2;
        tileAspectRatio = 1;
      } else if (tileCount <= 12) {
        columnCount = 4;
        rowCount = 3;
        tileAspectRatio = 1;
      } else {
        // Unsupported
        columnCount = 4;
        rowCount = 4;
      }
    } else if (gridAspectRatio <= 32 / 9) {
      // Ultrawide
      if (tileCount === 1) {
        columnCount = 1;
        rowCount = 1;
      } else if (tileCount === 2) {
        columnCount = 2;
        rowCount = 1;
      } else if (tileCount <= 4) {
        columnCount = 2;
        rowCount = 2;
      } else if (tileCount <= 6) {
        columnCount = 3;
        rowCount = 2;
      } else if (tileCount <= 8) {
        columnCount = 4;
        rowCount = 2;
      } else if (tileCount <= 12) {
        columnCount = 4;
        rowCount = 3;
      } else {
        // Unsupported
        columnCount = 4;
        rowCount = 4;
      }
    } else {
      // Super Ultrawide
      if (tileCount <= 6) {
        columnCount = tileCount;
        rowCount = 1;
      } else {
        columnCount = Math.ceil(tileCount / 2);
        rowCount = 2;
      }
    }

    return getSubGridPositions(
      tileCount,
      columnCount,
      rowCount,
      tileAspectRatio,
      gridBounds
    );
  }
}

function getSubGridPositions(
  tileCount,
  columnCount,
  rowCount,
  tileAspectRatio,
  gridBounds
) {
  if (tileCount === 0) {
    return [];
  }

  const newTilePositions = [];
  const gridWidth = gridBounds.width;
  const gridHeight = gridBounds.height;
  const gridOffsetLeft = gridBounds.offsetLeft || 0;
  const gridOffsetTop = gridBounds.offsetTop || 0;
  const gap = 8;

  const boxWidth = Math.round(
    (gridWidth - gap * (columnCount + 1)) / columnCount
  );
  const boxHeight = Math.round((gridHeight - gap * (rowCount + 1)) / rowCount);

  let tileWidth, tileHeight;

  if (tileAspectRatio) {
    const boxAspectRatio = boxWidth / boxHeight;

    if (boxAspectRatio > tileAspectRatio) {
      tileWidth = boxHeight * tileAspectRatio;
      tileHeight = boxHeight;
    } else {
      tileWidth = boxWidth;
      tileHeight = boxWidth / tileAspectRatio;
    }
  } else {
    tileWidth = boxWidth;
    tileHeight = boxHeight;
  }

  const paddingTop =
    (gridHeight - tileHeight * rowCount - gap * (rowCount - 1)) / 2;

  const paddingLeft =
    (gridWidth - tileWidth * columnCount - gap * (columnCount - 1)) / 2;

  for (let i = 0; i < tileCount; i++) {
    const verticalIndex = Math.floor(i / columnCount);
    const top =
      gridOffsetTop +
      verticalIndex * tileHeight +
      verticalIndex * gap +
      paddingTop;

    let rowItemCount;

    if (verticalIndex + 1 === rowCount && tileCount % columnCount !== 0) {
      rowItemCount = tileCount % columnCount;
    } else {
      rowItemCount = columnCount;
    }

    const horizontalIndex = i % columnCount;

    let centeringPadding = 0;

    if (rowItemCount < columnCount) {
      centeringPadding = Math.round(
        (gridWidth -
          (tileWidth * rowItemCount +
            (gap * rowItemCount - 1) +
            paddingLeft * 2)) /
          2
      );
    }

    const left =
      gridOffsetLeft +
      paddingLeft +
      centeringPadding +
      gap * horizontalIndex +
      tileWidth * horizontalIndex;

    newTilePositions.push({
      width: tileWidth,
      height: tileHeight,
      x: left,
      y: top,
    });
  }

  return newTilePositions;
}

export function VideoGrid({ participants }) {
  const [{ tiles, tilePositions }, setTileState] = useState({
    tiles: [],
    tilePositions: [],
  });
  const draggingTileRef = useRef(null);
  const isMounted = useIsMounted();

  const [gridRef, gridBounds] = useMeasure();

  useEffect(() => {
    setTileState(({ tiles }) => {
      const newTiles = [];
      const removedTileKeys = [];
      let presenterTileCount = 0;

      for (const tile of tiles) {
        const participant = participants.find(
          (participant) => participant.userId === tile.key
        );

        if (tile.presenter) {
          presenterTileCount++;
        }

        if (participant) {
          // Existing tiles
          newTiles.push({
            key: participant.userId,
            participant: participant,
            remove: false,
            presenter: tile.presenter,
          });
        } else {
          // Removed tiles
          removedTileKeys.push(tile.key);
          newTiles.push({
            key: tile.key,
            participant: tile.participant,
            remove: true,
            presenter: tile.presenter,
          });
        }
      }

      for (const participant of participants) {
        if (newTiles.some(({ key }) => participant.userId === key)) {
          continue;
        }

        // Added tiles
        newTiles.push({
          key: participant.userId,
          participant,
          remove: false,
          presenter: false,
        });
      }

      newTiles.sort((a, b) => (b.presenter ? 1 : 0) - (a.presenter ? 1 : 0));

      if (removedTileKeys.length > 0) {
        setTimeout(() => {
          if (!isMounted.current) {
            return;
          }

          setTileState(({ tiles }) => {
            const newTiles = tiles.filter(
              (tile) => !removedTileKeys.includes(tile.key)
            );

            return {
              tiles: newTiles,
              tilePositions: getTilePositions(
                newTiles.length,
                gridBounds,
                presenterTileCount
              ),
            };
          });
        }, 250);
      }

      return {
        tiles: newTiles,
        tilePositions: getTilePositions(
          newTiles.length,
          gridBounds,
          presenterTileCount
        ),
      };
    });
  }, [participants, gridBounds]);

  const animate = useCallback(
    (tiles) => (tileIndex) => {
      const tile = tiles[tileIndex];
      const tilePosition = tilePositions[tileIndex];
      const draggingTile = draggingTileRef.current;
      const dragging = draggingTile && tile.key === draggingTile.key;
      const remove = tile.remove;

      if (dragging) {
        return {
          width: tilePosition.width,
          height: tilePosition.height,
          x: draggingTile.offsetX + draggingTile.x,
          y: draggingTile.offsetY + draggingTile.y,
          scale: 1.1,
          opacity: 1,
          zIndex: 1,
          shadow: 15,
          immediate: (key) => key === "zIndex" || key === "x" || key === "y",
          from: {
            scale: 0,
            opacity: 0,
          },
          reset: false,
        };
      } else {
        return {
          ...tilePosition,
          scale: remove ? 0 : 1,
          opacity: remove ? 0 : 1,
          zIndex: 0,
          shadow: 1,
          from: {
            scale: 0,
            opacity: 0,
          },
          reset: false,
          immediate: (key) => key === "zIndex",
        };
      }
    },
    [tiles, tilePositions]
  );

  const [springs, api] = useSprings(tiles.length, animate(tiles), [
    tilePositions,
    tiles,
  ]);

  const bind = useDrag(({ args: [key], active, xy, movement }) => {
    const dragTileIndex = tiles.findIndex((tile) => tile.key === key);
    const dragTile = tiles[dragTileIndex];
    const dragTilePosition = tilePositions[dragTileIndex];

    let newTiles = tiles;

    const cursorPosition = [xy[0] - gridBounds.left, xy[1] - gridBounds.top];

    for (
      let hoverTileIndex = 0;
      hoverTileIndex < tiles.length;
      hoverTileIndex++
    ) {
      const hoverTile = tiles[hoverTileIndex];
      const hoverTilePosition = tilePositions[hoverTileIndex];

      if (hoverTile.key === key) {
        continue;
      }

      if (isInside(cursorPosition, hoverTilePosition)) {
        newTiles = moveArrItem(tiles, dragTileIndex, hoverTileIndex);

        newTiles = newTiles.map((tile) => {
          if (tile === hoverTile) {
            return { ...tile, presenter: dragTile.presenter };
          } else if (tile === dragTile) {
            return { ...tile, presenter: hoverTile.presenter };
          } else {
            return tile;
          }
        });

        newTiles.sort((a, b) => (b.presenter ? 1 : 0) - (a.presenter ? 1 : 0));

        setTileState((state) => ({ ...state, tiles: newTiles }));
        break;
      }
    }

    if (active) {
      if (!draggingTileRef.current) {
        draggingTileRef.current = {
          key: dragTile.key,
          offsetX: dragTilePosition.x,
          offsetY: dragTilePosition.y,
        };
      }

      draggingTileRef.current.x = movement[0];
      draggingTileRef.current.y = movement[1];
    } else {
      draggingTileRef.current = null;
    }

    api.start(animate(newTiles));
  });

  const onClickNameTag = useCallback(
    (participant) => {
      setTileState((state) => {
        let presenterTileCount = 0;

        const newTiles = state.tiles.map((tile) => {
          let newTile = tile;

          if (tile.participant === participant) {
            newTile = { ...tile, presenter: !tile.presenter };
          }

          if (newTile.presenter) {
            presenterTileCount++;
          }

          return newTile;
        });

        newTiles.sort((a, b) => (b.presenter ? 1 : 0) - (a.presenter ? 1 : 0));

        presenterTileCount;

        return {
          ...state,
          tiles: newTiles,
          tilePositions: getTilePositions(
            newTiles.length,
            gridBounds,
            presenterTileCount
          ),
        };
      });
    },
    [gridBounds]
  );

  return (
    <div className={styles.grid} ref={gridRef}>
      {springs.map(({ shadow, ...style }, i) => {
        const tile = tiles[i];

        return (
          <ParticipantTile
            {...bind(tile.key)}
            key={tile.key}
            style={{
              boxShadow: shadow.to(
                (s) => `rgba(0, 0, 0, 0.5) 0px ${s}px ${2 * s}px 0px`
              ),
              ...style,
            }}
            {...tile}
            onClickNameTag={onClickNameTag}
          />
        );
      })}
    </div>
  );
}

function ParticipantTile({
  style,
  participant,
  remove,
  onClickNameTag,
  ...rest
}) {
  const videoRef = useRef();

  useEffect(() => {
    if (participant.stream) {
      if (participant.local) {
        videoRef.current.muted = true;
      }

      videoRef.current.srcObject = participant.stream;
      videoRef.current.play();
    } else {
      videoRef.current.srcObject = null;
    }
  }, [participant.stream]);

  // Firefox doesn't respect the disablePictureInPicture attribute
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1611831

  return (
    <animated.div className={styles.participantTile} style={style} {...rest}>
      <div
        className={classNames(styles.participantName, {
          [styles.speaking]: participant.speaking,
        })}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClickNameTag(participant);
        }}
      >
        {participant.speaking ? (
          <MicIcon />
        ) : participant.audioMuted ? (
          <MuteMicIcon className={styles.muteMicIcon} />
        ) : null}
        <span>{participant.userId}</span>
      </div>
      {participant.videoMuted && (
        <DisableVideoIcon
          className={styles.videoMuted}
          width={48}
          height={48}
        />
      )}
      <video ref={videoRef} playsInline disablePictureInPicture />
    </animated.div>
  );
}
