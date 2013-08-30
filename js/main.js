/*global console, jQuery, THREE, TWEEN, sh_highlightDocument*/
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
		this.position = new V3();
		this.target = new V3();

		this.camera = params.camera;
		this.dims = params.dims;
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

		setTarget: function (position) {
			this.target.copy(position);

			new TWEEN.Tween(this.position)
				.to(this.target, 500)
				.easing(TWEEN.Easing.Cubic.Out)
				.start();
		},

		onMouseMove: function (event) {
			this.setMouse(event);
		},

		update: function () {
			var target = this.position;
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
			// camera.updateMatrix();

			this._needsUpdate = true;
			return false;

			/*
			if (this._needsUpdate) {
				this.onUpdate();
				this._needsUpdate = false;
			}
			*/
		}
	};

	// Scene
	// -----

	function DemoScene() {
		bindMethods(this, "resize", "animate", "render", "hotKey");

		this.el = $("#container");
		this.document = $(document);
		this.window = $(window);
		this.dims = new V2();

		this.slidesContent = $("#slides .slide");
		this.slides = [];

		this.camera = new Three.PerspectiveCamera(75, this.el.width() / this.el.height(), 1, 5000);
		this.camera.position.setZ(1500);

		this.scene = new Three.Scene();
		this.controls = new CameraControls({
			camera: this.camera,
			dims: this.dims,
			camScale: 0.2,
			camMin: 150,
			onUpdate: this.render
		});

		this.renderer = new Three.CSS3DRenderer();
		$(this.renderer.domElement).css("position", "absolute");
		this.el.append(this.renderer.domElement);

		this.grid = new Three.Object3D();
		this.scene.add(this.grid);
		this.initGrid(this.grid, 3, 2, 1400, 900);

		this.window.on("resize", this.resize);
		this.document.on("keydown", this.hotKey);

		this.resize();
		this.animate();
		this.goTo(0);
	}

	DemoScene.prototype = {
		initGrid: function (parent, rows, cols, width, height) {
			var hWidth = (cols - 1) * width / 2;
			var hHeight = (rows - 1) * height / 2;
			var count = rows * cols;
			var plane, slide, x, y;

			for (var i = 0; i < count; i ++) {
				x = i % cols * width - hWidth;
				y = Math.floor(i / cols) * height - hHeight;
				plane = this.addPlane(parent, x, y);
				slide = this.slidesContent[i];

				if (slide) {
					plane.el.html(slide);
					this.slides.push(plane);
				}
			}
		},

		addPlane: function (parent, x, y) {
			var el = $("<div>");
			var object = new Three.CSS3DObject(el[0]);

			object.el = el;
			object.position.set(x, y, 0);
			el.addClass("plane");
			parent.add(object);
			return object;
		},

		animate: function () {
			window.requestAnimationFrame(this.animate);
			TWEEN.update();
			this.controls.update();
			this.render();
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
		},

		hotKey: function (event) {
			switch (event.which) {
			case 37:
				this.prevSlide();
				event.preventDefault();
				break;
			case 39:
				this.nextSlide();
				event.preventDefault();
				break;
			}
		},

		goTo: function (index, dir) {
			var slides = this.slides;
			index = index + dir || 0;

			if (index > slides.length - 1) { index = 0; }
			else if (index < 0) { index = slides.length - 1; }

			var slide = this.slides[index];
			this.controls.setTarget(slide.position);
			this.__currentSlide = index;
		},

		prevSlide: function () {
			this.goTo(this.__currentSlide || 0, -1);
		},

		nextSlide: function () {
			this.goTo(this.__currentSlide || 0, 1);
		}
	};

	var demo = new DemoScene();
	sh_highlightDocument();

}(THREE, jQuery));
