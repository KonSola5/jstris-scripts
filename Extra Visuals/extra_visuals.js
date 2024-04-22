// ==UserScript==
// @name         Extra Visuals
// @version      2024-04-21
// @description  Display extra visuals such as finish line for Sprints and rotation centers!
// @author       KonSola5
// @match        https://*.jstris.jezevec10.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // (Game)this.activeBlock's position is based on the top-left of its matrix.
  // So rotation centers will be drawn with a certain offset related to that position.

  let stage = document.getElementById("stage");
  const lineCanvas = document.createElement("canvas");
  lineCanvas.setAttribute("id", "finishLine");
  lineCanvas.setAttribute("class", "layer bgLayer");
  lineCanvas.setAttribute("width", 248);
  lineCanvas.setAttribute("height", 480);
  stage.appendChild(lineCanvas);

  const rotCenterCanvas = document.createElement("canvas");
  rotCenterCanvas.setAttribute("id", "rotCenter");
  rotCenterCanvas.setAttribute("class", "layer rotCenterLayer");
  rotCenterCanvas.setAttribute("width", 248);
  rotCenterCanvas.setAttribute("height", 480);
  rotCenterCanvas.setAttribute("style", "z-index:3;");
  stage.appendChild(rotCenterCanvas);

  function getRotationCenter(set, pieceID) {
    switch (set) {
      case 0: // Standard
      case 7: // Cultris II Rotation System
        switch (pieceID) {
          case 0:
          case 1:
            return [2, 2]; // O, I
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
            return [1.5, 2.5]; // T, L, J, S, Z
          default:
            return undefined;
        }
      // Big Block Mode
      case 1:
      case 2:
        switch (pieceID) {
          case 0:
          case 1:
            return [4, 4]; // I, O
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
            return [3, 5]; // T, L, J, S, Z
          default:
            return undefined;
        }
      // Arika Rotation System
      case 3:
        switch (pieceID) {
          case 0:
            return [2.5, 1.5]; // I
          case 1:
            return [2, 2]; // O
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
            return [1.5, 1.5]; // T, L, J, S, Z
          default:
            return undefined;
        }
      // Pentomino
      case 4:
        switch (pieceID) {
          case 0: // I5
          case 2: // T5
          case 6: // J5
          case 7: // L5
          case 8: // N'
          case 9: // N
          case 10: // Y
          case 11: // Y'
            return [2.5, 2.5];
          case 1: // V5
          case 3: // U
          case 4: // W
          case 5: // X
          case 12: // P
          case 13: // Q
          case 14: // F
          case 15: // F'
          case 16: // Z5
          case 17: // S5
            return [1.5, 1.5];
          default:
            return undefined;
        }
      // M123
      case 5:
        switch (pieceID) {
          case 0:
            return [0.5, 0.5]; // O1
          case 1: // I2
          case 3: // V3
            return [1, 1];
          case 2:
            return [1.5, 1.5]; // I3
          default:
            return undefined;
        }
      // All 29
      case 6:
        switch (true) {
          case pieceID > 10: // Pentomino
            return getRotationCenter(4, pieceID - 11);
          case pieceID > 6: // M123
            return getRotationCenter(5, pieceID - 7);
          default: // Standard
            return getRotationCenter(0, pieceID);
        }
      // O-spin Rotation System
      case 8:
        switch (pieceID) {
          case 0:
            return [2, 2]; // I
          case 1:
            return undefined; // O
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
            return [1.5, 2.5]; // T, L, J, S, Z
          default:
            return undefined;
        }
      // Default/NONE
      default:
        return undefined;
    }
  }

  function drawRotationCenter(ctx, x, y, size, scale, set) {
    switch (set) {
      // SRS: •
      case 0:
      case 1:
      case 2:
      case 4:
      case 5:
      case 6: {
        ctx.beginPath();
        ctx.arc(x, y, size / (2 * scale), 0, 2 * Math.PI);
        ctx.fill();
        return;
      }
      // ARS: ^
      case 3: {
        ctx.beginPath();
        ctx.lineWidth = size / (6 * scale);
        ctx.moveTo(x - size / (2 * scale), y + size / (2 * scale));
        ctx.lineTo(x, y - size / (2 * scale));
        ctx.lineTo(x + size / (2 * scale), y + size / (2 * scale));
        ctx.stroke();
        return;
      }
      // Cultris II: ◻ without bottom with small • inside
      case 7: {
        ctx.beginPath();
        ctx.lineWidth = size / (6 * scale);
        ctx.moveTo(x - size / (2 * scale), y + size / (2 * scale));
        ctx.lineTo(x - size / (2 * scale), y - size / (2 * scale));
        ctx.lineTo(x + size / (2 * scale), y - size / (2 * scale));
        ctx.lineTo(x + size / (2 * scale), y + size / (2 * scale));
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x - size / 48, y, size / (4 * scale), 0, 2 * Math.PI);
        ctx.fill();
        return;
      }
      // O-spin RS: ◻
      case 8: {
        ctx.beginPath();
        ctx.lineWidth = size / (6 * scale);
        ctx.moveTo(x - size / (2 * scale), y + size / (2 * scale));
        ctx.lineTo(x - size / (2 * scale), y - size / (2 * scale));
        ctx.lineTo(x + size / (2 * scale), y - size / (2 * scale));
        ctx.lineTo(x + size / (2 * scale), y + size / (2 * scale));
        ctx.closePath();
        ctx.stroke();
        return;
      }
      default:
        return;
    }
  }

  ///////////////////////////////////
  //             Game              //
  ///////////////////////////////////

  try {
    Game.prototype.redrawMatrix = function () {
      let redrawLine = true;
      this.v.redrawMatrix();

      let center_ctx = document.getElementById("rotCenter").getContext("2d");
      if (center_ctx != null) {
        center_ctx.clearRect(0, 0, rotCenterCanvas.width, rotCenterCanvas.height);
        let center = getRotationCenter(this.activeBlock.set ?? 0, this.activeBlock.id);

        if (center) {
          center_ctx.fillStyle = "white";
          center_ctx.strokeStyle = "white";

          // Active piece
          {
            center_ctx.globalAlpha = 1;
            center_ctx.beginPath();
            let x = this.block_size * (this.activeBlock.pos.x + center[0]);
            let y = this.block_size * (this.activeBlock.pos.y + center[1]);

            drawRotationCenter(center_ctx, x, y, this.block_size, 3, this.activeBlock.set ?? 0);
          }
          {
            // Ghost piece
            center_ctx.globalAlpha = 0.5;
            center_ctx.beginPath();
            let x = this.block_size * (this.ghostPiece.pos.x + center[0]);
            let y = this.block_size * (this.ghostPiece.pos.y + center[1]);

            drawRotationCenter(center_ctx, x, y, this.block_size, 3, this.activeBlock.set ?? 0);
          }
        }
      }

      if (this.pmode != 1) {
        let ctx = document.getElementById("finishLine").getContext("2d");
        if (ctx != null && redrawLine) {
          ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        }
        redrawLine = false;
        return;
      } else {
        redrawLine = true;
        let ctx = document.getElementById("finishLine").getContext("2d");
        if (ctx != null) {
          ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
          if (this.linesRemaining > 0) {
            var line_x = (20 - this.linesRemaining) * this.block_size;
            ctx.beginPath();
            ctx.moveTo(0, line_x);
            ctx.lineTo(10 * this.block_size, line_x);
            // set the color to whatever you want by changing this
            ctx.strokeStyle = "#fc0377";
            ctx.stroke();
          }
        }
      }
    };
  } catch (error) {
    console.warn("Failed to inject into the Game prototype! This should only appear if not in the game.");
  }

  ///////////////////////////////////
  //           Replay              //
  ///////////////////////////////////

  try {
    let replayRedrawOriginal = View.prototype.redraw;

    View.prototype.redraw = function () {
      let redrawLine = true;
      replayRedrawOriginal.apply(this)

      let center_ctx = document.getElementById("rotCenter").getContext("2d");
      if (center_ctx != null) {
        center_ctx.clearRect(0, 0, rotCenterCanvas.width, rotCenterCanvas.height);
        let center = getRotationCenter(this.g.activeBlock.set ?? 0, this.g.activeBlock.id);

        if (center) {
          center_ctx.fillStyle = "white";
          center_ctx.strokeStyle = "white";

          // Active piece
          {
            center_ctx.globalAlpha = 1;
            center_ctx.beginPath();
            let x = this.block_size * (this.g.activeBlock.pos.x + center[0]);
            let y = this.block_size * (this.g.activeBlock.pos.y + center[1]);

            drawRotationCenter(center_ctx, x, y, this.block_size, 3, this.g.activeBlock.set ?? 0);
          }
          {
            // Ghost piece
            center_ctx.globalAlpha = 0.5;
            center_ctx.beginPath();
            let x = this.block_size * (this.g.ghostPiece.pos.x + center[0]);
            let y = this.block_size * (this.g.ghostPiece.pos.y + center[1]);

            drawRotationCenter(center_ctx, x, y, this.block_size, 3, this.g.activeBlock.set ?? 0);
          }
        }
      }

      if (this.g.pmode != 1) {
        let ctx = document.getElementById("finishLine").getContext("2d");
        if (ctx != null && redrawLine) {
          ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        }
        redrawLine = false;
        return;
      } else {
        redrawLine = true;
        let ctx = document.getElementById("finishLine").getContext("2d");
        if (ctx != null) {
          ctx.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
          if (this.g.linesRemaining > 0) {
            var line_x = (20 - this.g.linesRemaining) * this.block_size;
            ctx.beginPath();
            ctx.moveTo(0, line_x);
            ctx.lineTo(10 * this.block_size, line_x);
            // set the color to whatever you want by changing this
            ctx.strokeStyle = "#fc0377";
            ctx.stroke();
          }
        }
      }
    };
    
  } catch (error) {
    console.warn("Failed to inject into the View prototype! This should only appear if not in the replay.");
  }
})();
