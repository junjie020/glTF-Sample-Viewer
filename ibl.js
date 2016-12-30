// Vertex Shader
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec4 a_Color;\n' + 
  'uniform mat4 u_mvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main(){\n' +
  '  vec4 pos = u_mvpMatrix * a_Position;\n' + 
  '  v_Position = vec3(pos.xyz) / pos.w;\n' + 
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
  '  gl_Position = vec4(v_Position, 1.0);\n' +
  '}\n';

// Fragment Shader
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec3 u_LightPosition;\n' +
  'uniform samplerCube u_EnvSampler;\n' +
  'uniform vec3 u_Camera;\n' +
  'uniform vec3 u_BaseColor;\n' +
  'uniform float u_Metallic;\n' +
  'uniform float u_Roughness;\n' + 
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' + 
  'varying vec3 v_Position;\n' +

  'const float M_PI = 3.141592653589793;\n' +

  'void main(){\n' +
  '  vec3 diffuseColor = u_BaseColor;\n' +
  '  vec3 specularColor = vec3(0.8, 0.8, 0.8);\n' +
  //'  vec3 ambientColor = vec3(0.1, 0.1, 0.1);\n' + 
  '  vec3 n = normalize(v_Normal);\n' +
  '  vec3 l = normalize(u_LightPosition - v_Position);\n' +
  '  vec3 v = normalize(u_Camera - v_Position);\n' +
  '  vec3 h = normalize(l + v);\n' +
  '  float nDotV = max(0.0, dot(n,v));\n' +
  '  float nDotL = max(0.0, dot(n,l));\n' +
  '  float nDotH = max(0.0, dot(n,h));\n' +
  '  float vDotH = max(0.0, dot(v,h));\n' +

  // Fresnel Term: Schlick's Approximation
  '  float r0 = u_Metallic;\n' +
  '  float f = r0 + ((1.0 - r0) * pow(1.0 - nDotV, 5.0));\n' +

  // Geometric Attenuation Term: Schlick-Beckmann
  '  float roughness = u_Roughness;\n' +
  '  float a = roughness * roughness;\n' + // UE4 definition
  '  float k = ((roughness + 1.0) * (roughness + 1.0)) / 8.0;\n' +
  '  float g1L = nDotL / ((nDotL * (1.0 - k)) + k);\n' +
  '  float g1V = nDotV / ((nDotV * (1.0 - k)) + k);\n' +
  '  float g = g1L * g1V;\n' +

  // Normal Distribution Function: GGX (Trowbridge-Reitz)
  '  float a2 = a * a;\n' +
  '  float nDotH2 = nDotH * nDotH;\n' +
  '  float denom = M_PI * (nDotH * nDotH * (a2 - 1.0) + 1.0) * (nDotH * nDotH * (a2 - 1.0) + 1.0);\n' +
  '  float d = a2 / denom;\n' +

  // BRDF
  '  float brdf = (d * f * g) / (4.0 * nDotL * nDotV);\n' +

  '  vec3 diffuse = 0.8 * diffuseColor * nDotL;\n' + 
  '  vec3 specular = specularColor * brdf;\n' +
  //'  vec3 camera = normalize(u_Camera);\n' +
  //'  vec3 camToPos = normalize(v_Position - camera);\n' +
  //'  vec3 reflected = normalize(reflect(camToPos, n));\n' +  
  //'  vec3 testDir = vec3(1.0, 0.0, 0.0);\n' +
  //'  float weight = max(dot(testDir, normal), 0.0);\n' +
  //'  gl_FragColor = vec4(v_Color.xyz * weight, 1.0);\n' + 
  //'  gl_FragColor = textureCube(u_EnvSampler, reflected);' +
  '  gl_FragColor = vec4(diffuse + specular, v_Color.a);\n' +
  '}\n';

function initCubeBuffers(length, width, height, gl) {
  var x = length/2.0;
  var y = height/2.0;
  var z = width/2.0;

  // Vertices
  var vertices = new Float32Array([
    x, -y, -z, // Back triangle 1
    -x, y, -z,
    -x, -y, -z,

    -x, y, -z,  // Back triangle 2
    x, -y, -z,
    x, y, -z,

    x, y, z,    // Right triangle 1
    x, y, -z,
    x, -y, -z,

    x, y, z,    // Right triangle 2
    x, -y, -z,
    x, -y, z,

    x, y, z,    // Front triangle 1
    x, -y, z,
    -x, y, z,

    x, -y, z,   // Front triangle 2
    -x, -y, z,
    -x, y, z,

    -x, y, z,   // Left triangle 1
    -x, -y, z,
    -x, -y, -z,

    -x, y, z,   // Left triangle 2
    -x, -y, -z,
    -x, y, -z,

    -x, y, -z,  // Top triangle 1
    x, y, z,
    -x, y, z,

    -x, y, -z,  // Top triangle 2
    x, y, -z,
    x, y, z,

    -x, -y, z,  // Bottom triangle 1
    x, -y, z,
    -x, -y, -z,
    
    x, -y, z,   // Bottom triangle 2
    x, -y, -z,
    -x, -y, -z
  ]);

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Position);

  // Colors
  var colors = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // back
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
   
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
 
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
  
    1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0, // left
    1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0,

    0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0, // top
    0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0,

    1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0, // bottom
    1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0,
  ]);

  var colorBuffer = gl.createBuffer();
  if (!colorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Color);

  // Normals
  var normals = new Float32Array([
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0, // Back face
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,

    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // Right face
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
 
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // Front face
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,

    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0, // Left face
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,

    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // Top face
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,

    0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0, // Bottom face
    0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0
  ]);

  var normalBuffer = gl.createBuffer();
  if (!normalBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Normal); 

  return 1;
}

function loadCubeMap(gl) { 
  var texture = gl.createTexture();
  var u_EnvSampler = gl.getUniformLocation(gl.program, 'u_EnvSampler');
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  var faces = [["textures/desertsky_right.png", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
               ["textures/desertsky_left.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
               ["textures/desertsky_up.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
               ["textures/desertsky_down.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
               ["textures/desertsky_front.png", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
               ["textures/desertsky_back.png", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
  for (var i = 0; i < faces.length; i++) {
    var face = faces[i][1];
    var image = new Image();
    image.onload = function(texture, face, image) {
      return function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }
    } (texture, face, image);
    image.src = faces[i][0];
  }

  gl.uniform1i(u_EnvSampler, 0);
  return 1;
}

function updateDiffuse(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
  gl.uniform3f(u_BaseColor, value[0]/255, value[1]/255, value[2]/255);
  draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function updateMetallic(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_Metallic = gl.getUniformLocation(gl.program, 'u_Metallic');
  gl.uniform1f(u_Metallic, value);
  draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function updateRoughness(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_Roughness = gl.getUniformLocation(gl.program, 'u_Roughness');
  gl.uniform1f(u_Roughness, value);
  draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function main() {
  var canvas = document.getElementById('canvas');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  var gl = canvas.getContext("webgl");
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, VSHADER_SOURCE);
  gl.compileShader(vertexShader);
  var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
  if (!compiled) {
    console.log('Failed to compile vertex shader');
    var compilationLog = gl.getShaderInfoLog(vertexShader);
    console.log('Shader compiler log: ' + compilationLog);
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, FSHADER_SOURCE);
  gl.compileShader(fragmentShader);
  compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
  if (!compiled) {
    console.log('Failed to compile fragment shader');
    var compilationLog = gl.getShaderInfoLog(fragmentShader);
    console.log('Shader compiler log: ' + compilationLog);
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.program = program;

  // Set positions of vertices
  initCubeBuffers(1.0, 1.0, 1.0, gl);

  // Create cube map
  loadCubeMap(gl);

  // Light
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  gl.uniform3f(u_LightPosition, 0.0, 0.0, 1.5);

  // Camera
  var u_Camera = gl.getUniformLocation(gl.program, 'u_Camera');
  gl.uniform3f(u_Camera, 0.0, 0.0, 3.0);

  // Model matrix
  var modelMatrix = mat4.create();
  
  // View matrix
  var viewMatrix = mat4.create();
  var eye = vec3.fromValues(0.0, 0.0, 3.0);
  var at = vec3.fromValues(0.0, 0.0, 0.0);
  var up = vec3.fromValues(0.0, -1.0, 0.0);
  mat4.lookAt(viewMatrix, eye, at, up);

  // Projection matrix
  var projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, 30.0, 1.0, 0.1, 100.0);

  // Get location of mvp matrix uniform
  var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');

  // Get location of normal matrix uniform
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  // Set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Enable depth test
  gl.enable(gl.DEPTH_TEST);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  document.onkeydown = function(ev) {keydown(ev, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);};

  // Initialize GUI  
  var gui = new dat.GUI();
  var folder = gui.addFolder("Metallic-Roughness Material");
  var material = {
    'Base Color': [180, 180, 180],
    'Metallic': 0.5,
    'Roughness': 0.5
  };
  folder.addColor(material, 'Base Color').onChange(function(value) {
    updateDiffuse(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.add(material, 'Metallic', 0.0, 1.0).onChange(function(value) {
    updateMetallic(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.add(material, 'Roughness', 0.0, 1.0).onChange(function(value) {
    updateRoughness(value, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.open();
  updateDiffuse(material["Base Color"], gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  updateMetallic(material["Metallic"], gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  updateRoughness(material["Roughness"], gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);

  // Draw
  draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

var roll = 0.0;
var pitch = 0.0;
var translate = 0.0;
function keydown(ev, gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {
    case 39: roll+=0.02; break;
    case 37: roll-=0.02; break;
    case 38: pitch+=0.02; break;
    case 40: pitch-=0.02; break;
    case 87: translate+=0.1; break;
    case 83: translate-=0.1; break;
    default: return;
  }

  draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function draw(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  // Update model matrix
  modelMatrix = mat4.create();
  mat4.rotateY(modelMatrix, modelMatrix, roll);
  mat4.rotateX(modelMatrix, modelMatrix, pitch);
  //var translateVec = vec3.fromValues(0.0, translate, 0.0);
  //mat4.translate(modelMatrix, modelMatrix, translateVec);

  // Update mvp matrix
  var mvpMatrix = mat4.create();
  mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
  mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);
  gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);

  // Update normal matrix
  var normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix); 

  // Draw
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}