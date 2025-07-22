import axios from 'axios';

export const generateImage = async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        input: {
          prompt,
          width: 768,
          height: 768,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: 25
        }
      },
      {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait'
        }
      }
    );

    const imageUrl = response.data.output[0];
    res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image generation error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Image generation failed",
      details: error.response?.data || error.message
    });
  }
};
