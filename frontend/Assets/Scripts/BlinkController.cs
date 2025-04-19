using UnityEngine;
using System.Collections;

public class NeuroBlinkController : MonoBehaviour
{
    [Header("Blend Shape Settings")]
    [Range(0, 100)] public float maxBlinkIntensity = 100f;
    [Range(0, 1)] public float blinkCloseEase = 0.3f;
    [Range(0, 1)] public float blinkOpenEase = 0.7f;

    [Header("Timing Settings")]
    public float minBlinkInterval = 1.5f;
    public float maxBlinkInterval = 4f;
    public float fullBlinkDuration = 0.8f;
    public float microBlinkChance = 0.3f;
    public float microBlinkDuration = 0.3f;

    [Header("References")]
    public SkinnedMeshRenderer faceMesh;
    public string blinkBlendShapeName = "まばたき";

    private int blinkBlendIndex = -1;
    private bool isBlinking = false;
    private float currentBlinkWeight = 0f;

    void Start()
    {
        blinkBlendIndex = faceMesh.sharedMesh.GetBlendShapeIndex(blinkBlendShapeName);
        if (blinkBlendIndex == -1) Debug.LogError("Blink blend shape not found!");

        StartCoroutine(BlinkBehaviorRoutine());
    }

    IEnumerator BlinkBehaviorRoutine()
    {
        while (true)
        {
            if (!isBlinking)
            {
                float waitTime = Random.Range(minBlinkInterval, maxBlinkInterval);
                yield return new WaitForSeconds(waitTime);

                if (!isBlinking)
                {
                    bool isMicroBlink = Random.value < microBlinkChance;
                    float duration = isMicroBlink ? microBlinkDuration : fullBlinkDuration;
                    float intensity = isMicroBlink ? maxBlinkIntensity * 0.6f : maxBlinkIntensity;

                    yield return StartCoroutine(ExecuteBlink(intensity, duration));

                    if (!isMicroBlink && Random.value < 0.2f)
                    {
                        yield return new WaitForSeconds(0.15f);
                        yield return StartCoroutine(ExecuteBlink(maxBlinkIntensity * 0.4f, fullBlinkDuration * 0.6f));
                    }
                }
            }
            yield return null;
        }
    }

    IEnumerator ExecuteBlink(float targetIntensity, float duration)
    {
        if (blinkBlendIndex == -1 || isBlinking) yield break;

        isBlinking = true;
        float elapsed = 0f;

        while (elapsed < duration * blinkCloseEase)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / (duration * blinkCloseEase));
            currentBlinkWeight = Mathf.SmoothStep(0, targetIntensity, t);
            faceMesh.SetBlendShapeWeight(blinkBlendIndex, currentBlinkWeight);
            yield return null;
        }

        float holdDuration = duration * 0.1f;
        yield return new WaitForSeconds(holdDuration);
        elapsed += holdDuration;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01((elapsed - (duration * blinkCloseEase + holdDuration)) / (duration * blinkOpenEase));
            currentBlinkWeight = Mathf.SmoothStep(targetIntensity, 0, t);
            faceMesh.SetBlendShapeWeight(blinkBlendIndex, currentBlinkWeight);
            yield return null;
        }

        currentBlinkWeight = 0f;
        faceMesh.SetBlendShapeWeight(blinkBlendIndex, currentBlinkWeight);
        isBlinking = false;
    }

    public void ForceBlink(float intensity = 1f, float duration = -1f)
    {
        if (!isBlinking)
        {
            float blinkDuration = duration > 0 ? duration : fullBlinkDuration;
            StartCoroutine(ExecuteBlink(maxBlinkIntensity * intensity, blinkDuration));
        }
    }

    void OnDisable()
    {
        StopAllCoroutines();
        if (faceMesh != null && blinkBlendIndex != -1)
        {
            faceMesh.SetBlendShapeWeight(blinkBlendIndex, 0);
        }
    }
}