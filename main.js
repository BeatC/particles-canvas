"use strict";

const DISTANCE_BETWEEN_VERTICES = 200;

class Point {
  constructor(opts) {
    let { x, y, angle, velocity } = opts;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.velocity = velocity;
  }

  move() {
    this.x = this.x + Math.cos(this.angle);
    this.y = this.y + Math.sin(this.angle);
  }
}

class Graph {
  constructor(opts = {}) {
    let { points, connectionFn } = opts;
    let defaultConnectionFn = () => true;
    this.points = points || [];
    this.connectionFn = connectionFn || defaultConnectionFn;

    this.initConnections();
    this.calculateConnections();
  }

  initConnections() {
    let points = this.points;
    if (points && points.length) {
      this.connections = new Array(points.length);
      points.forEach((point, i, arr) => {
        this.connections[i] = new Array(points.length);
      });
    } else {
      this.connections = [];
    }
  }

  addPoint(point) {
    this.points.push(point);
    this.initConnections();
    this.calculateConnections();
  }

  removePoint(point) {
    this.points = this.points.filter((el) => {
      return point !== el;
    });
    this.initConnections();
    this.calculateConnections();
  }

  getPoints() {
    return this.points;
  }

  getConnections() {
    return this.connections;
  }

  move() {
    this.points.forEach(point => point.move());
    this.calculateConnections();
  }

  calculateConnections() {
    let points = this.points;
    if (points.length > 1) {
      points.forEach((a, outerIndex) => {
        let innerList = points.slice(0, outerIndex + 1);
        innerList.forEach((b, innerIndex) => {
          let hasConnection;
          if (outerIndex !== innerIndex) {
            hasConnection = this.connectionFn(a, b);
          } else {
            hasConnection = false;
          }
          this.connections[outerIndex][innerIndex] = hasConnection;
        });
      });
    }
  }

  removePointsByCriteria(criteriaFn) {
    this.points.forEach(el => {
      if (!criteriaFn(el)) {
        this.removePoint(el);
      }
    });
    this.initConnections();
    this.calculateConnections(criteriaFn);
  }
}

class Demo {
  constructor(opts) {
    let { id, connectionFn } = opts;
    this.graph = new Graph({ connectionFn });
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.drawer = new Drawer(this.ctx);

    this.setupHandlers();
  }

  setupHandlers() {
    this.canvas.onclick = (e) => {
      let x = e.layerX;
      let y = e.layerY;
      let velocity = Math.random() * 1;
      let angle = Math.random() * (Math.PI * 2);

      let options = { x, y, velocity, angle };
      let point = new Point(options);
      this.graph.addPoint(point);
    };
  }

  clear() {
    let ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  mainLoop() {
    this.render();
    this.graph.move();
    this.removePointsOutOfScreen();
  }

  render() {
    let points = this.graph.getPoints();
    let connections = this.graph.getConnections();
    this.clear();
    if (points.length) {
      this.drawer.drawConnections(points, connections);
      points.forEach((point) => {
        this.drawer.drawPoint(point);
      });
    }
    requestAnimationFrame(this.mainLoop.bind(this));
  }

  removePointsOutOfScreen() {
    this.graph.removePointsByCriteria(point => {
      return (point.x < this.canvas.width && point.x > 0) &&
             (point.y < this.canvas.height && point.y > 0);
    });
  }
}

class Drawer {
  constructor(ctx) {
    this.ctx = ctx;
  }
  drawPoint(point) {
    let ctx = this.ctx;
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();
  }

  drawConnections(points, connections) {
    points.forEach((a, outerIndex) => {
      let innerList = points.slice(0, outerIndex + 1);
      innerList.forEach((b, innerIndex) => {
        if (connections[outerIndex][innerIndex]) {
          this.drawConnection(a, b);
        }
      });
    });
  };

  drawConnection(start, end) {
    let ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
}

const demo = new Demo({
  id: 'scene',
  connectionFn: (a, b) => {
    let distance = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    return distance < DISTANCE_BETWEEN_VERTICES;
  }
});

demo.mainLoop();
