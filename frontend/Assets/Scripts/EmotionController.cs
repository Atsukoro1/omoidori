using UnityEngine;

public enum Emotion
{
    Default = 0, // All expressions to 0 / Anim int 1
    Smug = 1, // Expression 10 - 74 percent / Anim int 2
    Scared = 2, // Expression 8 // Anim int 5
    Blushing = 3, // Expression 19 // Anim int 3
    Annoyed = 4, // Expression 12 // Anim int 4
    Confused = 5, // Expression 22 // Anim int 8
    Surprised = 6, // Expression 15 // Anim int 5
    Happy = 7, // Expression 1 // Anim int 7
}

public class BlendShapeIndexes
{
    public int smug;
    public int scared;
    public int blushing;
    public int annoyed;
    public int confused;
    public int surprised;
    public int happy;
}

public class EmotionController : MonoBehaviour
{
    public SkinnedMeshRenderer meshRenderer;
    private BlendShapeIndexes blendShapeIndexes;
    private Animator animator;
    private int animIntHash;

    void Start()
    {
        BlendShapeIndexes shapeIndexes = new BlendShapeIndexes();
        Mesh sharedMesh = meshRenderer.sharedMesh;

        shapeIndexes.smug = sharedMesh.GetBlendShapeIndex("expression_10");
        shapeIndexes.scared = sharedMesh.GetBlendShapeIndex("expression_8");
        shapeIndexes.blushing = sharedMesh.GetBlendShapeIndex("expression_19");
        shapeIndexes.annoyed = sharedMesh.GetBlendShapeIndex("expression_12");
        shapeIndexes.confused = sharedMesh.GetBlendShapeIndex("expression_22");
        shapeIndexes.surprised = sharedMesh.GetBlendShapeIndex("expression_15");
        shapeIndexes.happy = sharedMesh.GetBlendShapeIndex("expression_1");

        this.blendShapeIndexes = shapeIndexes;
        this.animator = GetComponent<Animator>();
        this.animIntHash = Animator.StringToHash("animBaseInt");
    }

    public void SetDefaultEmotion()
    {
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.smug, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.scared, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.scared, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.blushing, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.annoyed, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.confused, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.surprised, 0);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.happy, 0);

        animator.SetInteger(this.animIntHash, 1);
    }

    public void SetSmugEmotion()
    {
        animator.SetInteger(animIntHash, 2);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.smug, 74);
    }

    public void SetScaredEmotion()
    {
        animator.SetInteger(animIntHash, 5);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.scared, 100);
    }

    public void SetBlushingEmotion()
    {
        animator.SetInteger(animIntHash, 3);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.blushing, 100);
    }

    public void SetAnnoyedEmotion()
    {
        animator.SetInteger(animIntHash, 4);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.annoyed, 100);
    }

    public void SetConfusedEmotion()
    {
        animator.SetInteger(animIntHash, 8);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.confused, 100);
    }

    public void SetSurprisedEmotion()
    {
        animator.SetInteger(animIntHash, 5);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.surprised, 100);
    }

    public void SetHappyEmotion()
    {
        animator.SetInteger(animIntHash, 1);
        meshRenderer.SetBlendShapeWeight(this.blendShapeIndexes.happy, 100);
    }
}
