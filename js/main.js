/*global console, jQuery, THREE*/
(function (Three, $) {
	"use strict";

	// Utils / aliases
	// ---------------

	var slice = Array.prototype.slice;
	var V2 = Three.Vector2;
	var V3 = Three.Vector3;

	var bindMethods = function () {
		var scope = arguments[0];
		var methods = slice.call(arguments, 1);
		var m;

		for (var i = 0, il = methods.length; i < il; i ++) {
			m = methods[i];
			scope[m] = $.proxy(scope[m], scope);
		}
	};

	// Controls
	// --------

	function CameraControls(params) {
		bindMethods(this, "onMouseMove");

		this.window = $(window);
		this.mouse = new V2();

		this.camera = params.camera;
		this.dims = params.dims;
		this.target = params.target;
		this.camScale = params.camScale;
		this.camMin = params.camMin;
		this.onUpdate = params.onUpdate;

		this.window.on("mousemove", this.onMouseMove);
	}

	CameraControls.prototype = {
		setMouse: function (event) {
			var dims = this.dims;
			this.mouse.set(event.clientX - dims.x / 2, event.clientY - dims.y / 2);
		},

		onMouseMove: function (event) {
			this.setMouse(event);

			var target = this.target;
			var camScale = this.camScale;
			var camMin = this.camMin;
			var mouse = this.mouse;
			var camera = this.camera;
			var camPos = camera.position;

			var nx = (mouse.x - camera.position.x + target.x) * camScale;
			var ny = (mouse.y + camera.position.y - target.y) * camScale;
			var nz = (0.001 * mouse.lengthSq() - camera.position.z + target.z) * camScale + camMin;

			camPos.x += nx;
			camPos.y -= ny;
			camPos.z += nz;

			camera.lookAt(target);
			camera.updateMatrix();

			this._needsUpdate = true;
			return false;
		},

		update: function () {
			if (this._needsUpdate) {
				this.onUpdate();
				this._needsUpdate = false;
			}
		}
	};

	// Scene
	// -----

	function DemoScene() {
		bindMethods(this, "resize", "animate", "render");

		this.el = $("#container");
		this.window = $(window);
		this.dims = new V2();

		this.camera = new Three.PerspectiveCamera(75, this.el.width() / this.el.height(), 1, 5000);
		this.camera.position.z = 1500;

		this.scene = new Three.Scene();
		this.controls = new CameraControls({
			camera: this.camera,
			dims: this.dims,
			target: this.scene.position,
			camScale: 0.2,
			camMin: 200,
			onUpdate: this.render
		});

		this.renderer = new Three.CSS3DRenderer();
		$(this.renderer.domElement).css("position", "absolute");
		this.el.append(this.renderer.domElement);

		this.grid = new Three.Object3D();
		this.scene.add(this.grid);
		this.initGrid(this.grid, 4, 4, 400, 400);

		this.window.on("resize", this.resize);
		this.resize();
		this.animate();
	}

	DemoScene.prototype = {
		initGrid: function (parent, rows, cols, width, height) {
			var hWidth = (cols - 1) * width / 2;
			var hHeight = (rows - 1) * height / 2;
			var count = rows * cols;
			var x, y;

			for (var i = 0; i < count; i ++) {
				x = i % cols * width - hWidth;
				y = Math.floor(i / cols) * height - hHeight;
				this.addPlane(parent, x, y);
			}
		},

		addPlane: function (parent, x, y) {
			var el = $("<div>");
			var object = new Three.CSS3DObject(el[0]);

			object.position.set(x, y, 0);
			el.addClass("plane");
			parent.add(object);
			return object;
		},

		animate: function () {
			window.requestAnimationFrame(this.animate);
			this.controls.update();
		},

		render: function () {
			this.renderer.render(this.scene, this.camera);
		},

		resize: function () {
			var el = this.el;
			var w = el.width();
			var h = el.height();

			this.camera.aspect = w / h;
			this.camera.updateProjectionMatrix();
			this.dims.set(w, h);
			this.renderer.setSize(w, h);
			this.render();
		}
	};

	var demo = new DemoScene();

}(THREE, jQuery));
