precision highp float;


#include <tonemapping.glsl>


uniform float u_EnvIntensity;
uniform float u_EnvBlurNormalized;
uniform int u_MipCount;
uniform samplerCube u_GGXEnvSampler;

uniform sampler2D u_panorama;

out vec4 FragColor;
in vec3 v_TexCoords;

#define MATH_PI 3.1415926535897932384626433832795
vec2 dirToUV(vec3 dir)
{
	return vec2(
		0.5f + 0.5f * atan(dir.z, dir.x) / MATH_PI,
		acos(dir.y) / MATH_PI);
}

vec4 sample_source(vec3 dir, float lod)
{
	vec2 src = dirToUV(dir);

    // vec4 p_clr = textureLod(u_panorama, src, lod);
    //vec4 cm_clr = textureLod(uCubeMap, dir, lod);

    vec4 p_clr = texture(u_panorama, src);
    vec4 cm_clr = texture(u_GGXEnvSampler, dir);

    vec4 diff = p_clr - cm_clr;//cm_clr - p_clr;
    return vec4(
        max(diff.r, 0.0),
        max(diff.g, 0.0),
        max(diff.b, 0.0),
        max(diff.a, 0.0)
    );

}


void main()
{
    //vec4 color = textureLod(u_GGXEnvSampler, v_TexCoords, u_EnvBlurNormalized * float(u_MipCount - 1)) * u_EnvIntensity;

    vec4 color = sample_source(v_TexCoords, 0.0);

#ifdef LINEAR_OUTPUT
    FragColor = color.rgba;
#else
    FragColor = vec4(toneMap(color.rgb), color.a);
#endif
}
