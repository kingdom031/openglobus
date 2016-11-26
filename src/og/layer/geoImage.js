goog.provide('og.layer.GeoImage');

goog.require('og.layer.BaseGeoImage');
goog.require('og.inheritance');

/**
 * Used to load and display a single image over specific corner coordinates on the globe, implements og.layer.BaseGeoImage interface.
 * @class
 * @extends {og.layer.BaseGeoImage}
 */
og.layer.GeoImage = function (name, options) {
    og.inheritance.base(this, name, options);

    /**
     * Image object.
     * @private
     * @type {Image}
     */
    this._image = options.image || null;

    /**
     * Image source url path.
     * @private
     * @type {String}
     */
    this._src = options.src || null;
};

og.inheritance.extend(og.layer.GeoImage, og.layer.BaseGeoImage);

/**
 * GeoImage layer {@link og.layer.GeoImage} object factory.
 * @static
 * @returns {og.layer.GeoImage} Returns image layer.
 */
og.layer.geoImage = function (name, options) {
    return new og.layer.GeoImage(name, options);
};

/**
 * Sets image source url path.
 * @public
 * @param {String} srs - Image url path.
 */
og.layer.GeoImage.prototype.setSrc = function (src) {
    this._planet && this._planet._geoImageCreator.remove(this);
    this._src = src;
    this._sourceReady = false;
};

/**
 * Sets image object.
 * @public
 * @param {Image} image - Image object.
 */
og.layer.GeoImage.prototype.setImage = function (image) {
    this._planet && this._planet._geoImageCreator.remove(this);
    this._image = image;
    this._src = image.src;
    this._sourceReady = false;
};

/**
 * Creates source gl texture.
 * @virtual
 * @protected
 */
og.layer.GeoImage.prototype._createSourceTexture = function () {
    if (!this._sourceCreated) {
        this._sourceTexture = this._planet.renderer.handler.createTexture_n(this._image);
        this._sourceCreated = true;
    }
};

/**
 * @private
 * @param {Image} img
 */
og.layer.GeoImage.prototype._onLoad = function (img) {
    this._frameWidth = img.width;
    this._frameHeight = img.height;
    this._sourceReady = true;
    this._planet._geoImageCreator.add(this);
};

/**
 * Loads planet segment material. In this case - GeoImage source image.
 * @virtual
 * @public
 * @param {og.planetSegment.Material} material - GeoImage planet material.
 */
og.layer.GeoImage.prototype.loadMaterial = function (material) {
    material.isLoading = true;
    this._creationProceeding = true;
    if (!this._sourceReady && this._src) {
        if (this._image) {
            if (this._image.complete) {
                this._onLoad(this._image);
            } else if (this._image.src) {
                var that = this;
                this._image.addEventListener('load', function (e) {
                    that._onLoad(this);
                });
            }
        } else {
            var that = this;
            this._image = new Image();
            this._image.addEventListener('load', function (e) {
                that._onLoad(this);
            });
            this._image.src = this._src;
        }
    } else {
        this._planet._geoImageCreator.add(this);
    }
};

/**
 * @virtual
 * @param {og.planetSegment.Material} material - GeoImage material.
 */
og.layer.GeoImage.prototype.abortMaterialLoading = function (material) {
    this._image && (this._image.src = '');
    this._creationProceeding = false;
    material.isLoading = false;
    material.isReady = false;
};

og.layer.GeoImage.prototype._renderingProjType1 = function () {
    var p = this._planet,
    h = p.renderer.handler,
    gl = h.gl,
    creator = p._geoImageCreator;

    this._refreshFrame && this._createFrame();
    this._createSourceTexture();

    var f = creator._framebuffer;
    f.setSize(this._frameWidth, this._frameHeight);
    f.activate();

    h.shaderPrograms.geoImageTransform.activate();
    var sh = h.shaderPrograms.geoImageTransform._program;
    var sha = sh.attributes,
        shu = sh.uniforms;

    var tr = this.transparentColor[0],
        tg = this.transparentColor[1],
        tb = this.transparentColor[2];

    gl.disable(gl.CULL_FACE);

    f.bindOutputTexture(this._materialTexture);
    gl.clearColor(tr, tg, tb, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, creator._texCoordsBuffer);
    gl.vertexAttribPointer(sha.texCoords._pName, creator._texCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBuffer);
    gl.vertexAttribPointer(sha.corners._pName, this._gridBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(shu.extentParams._pName, this._extentMercParams);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);
    gl.uniform1i(shu.sourceTexture._pName, 0);
    sh.drawIndexBuffer(gl.TRIANGLE_STRIP, creator._indexBuffer);
    f.deactivate();

    gl.enable(gl.CULL_FACE);

    this._ready = true;

    this._creationProceeding = false;
};

og.layer.GeoImage.prototype._renderingProjType0 = function () {
    var p = this._planet,
    h = p.renderer.handler,
    gl = h.gl,
    creator = p._geoImageCreator;

    this._refreshFrame && this._createFrame();
    this._createSourceTexture();

    var f = creator._framebuffer;
    f.setSize(this._frameWidth, this._frameHeight);
    f.activate();

    h.shaderPrograms.geoImageTransform.activate();
    var sh = h.shaderPrograms.geoImageTransform._program;
    var sha = sh.attributes,
        shu = sh.uniforms;

    var tr = this.transparentColor[0],
        tg = this.transparentColor[1],
        tb = this.transparentColor[2];

    gl.disable(gl.CULL_FACE);

    f.bindOutputTexture(this._materialTexture);
    gl.clearColor(tr, tg, tb, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, creator._texCoordsBuffer);
    gl.vertexAttribPointer(sha.texCoords._pName, creator._texCoordsBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBuffer);
    gl.vertexAttribPointer(sha.corners._pName, this._gridBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(shu.extentParams._pName, this._extentWgs84Params);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._sourceTexture);
    gl.uniform1i(shu.sourceTexture._pName, 0);
    sh.drawIndexBuffer(gl.TRIANGLE_STRIP, creator._indexBuffer);
    f.deactivate();

    gl.enable(gl.CULL_FACE);

    this._ready = true;

    this._creationProceeding = false;
};