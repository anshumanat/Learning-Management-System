const SubSection  = require("../models/SubSection")
const Section = require("../models/Section");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create SubSection
exports.createSubSection = async (req,res)=>{
 
    try{
          // DEBUG: Log req.body and req.files to diagnose frontend/backend mismatch
          console.log('REQ.BODY:', req.body);
          console.log('REQ.FILES:', req.files);
          //fetch data from Req body
          const {sectionId,title, timeDuration, description} = req.body;
          //extract file/video
          const video = req.files && (req.files.videoFiles || req.files.video || req.files["videoFiles"]);
          //validation
          if(!sectionId || !title || !description || !video || !timeDuration){
            return res.status(400).json({
                 success:false,
                 message:"All fields are required",
            });
          }
          //upload video to cloudinary
          const uploadDetails = await uploadImageToCloudinary(video,process.env.FOLDER_NAME); 
          //create a Sub Section
          const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            VideoUrl:uploadDetails.secure_url,
          })
          //update section with this sub section ObjectId
          const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                               {$push:{
                                                                subSection:subSectionDetails._id,
                                                               }},
                                                               {new:true})
                                                               .populate("subSection")  // populate the subSection array
                                                               .exec();
          // Fetch the parent course and populate all sections and subsections
          const parentCourse = await Course.findOne({ courseContent: sectionId })
            .populate({
              path: "courseContent",
              populate: {
                path: "subSection",
              },
            })
            .exec();
          // Log the updated section with populated subSections
          console.log("Updated Section with populated subSections:", updatedSection);
          //return res
          return res.status(200).json({
            success:true,
            message:"Sub Section Created Successfully",
            updateCourseDetails: parentCourse,
          });
    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Internal Server Error",
            error:error.message,
        })
    }
 
};

// Update SubSection
exports.updateSubSection = async (req, res) => {
  try {
    // Fetch data
    const { subSectionId, title, timeDuration, description } = req.body;

    // Fetch video file if provided
    const video = req.files?.videoFiles;

    // Find existing subsection
    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Update fields if provided
    if (title) subSection.title = title;
    if (timeDuration) subSection.timeDuration = timeDuration;
    if (description) subSection.description = description;

    // If new video is uploaded
    if (video) {
      const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);
      subSection.VideoUrl = uploadDetails.secure_url;
    }

    // Save the updated subsection
    await subSection.save();

    return res.status(200).json({
      success: true,
      message: "SubSection updated successfully",
      data: subSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update SubSection",
      error: error.message,
    });
  }
};


// Delete SubSection
exports.deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;

    if (!subSectionId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "SubSectionId and SectionId are required",
      });
    }

    // Delete the subsection
    const deletedSubSection = await SubSection.findByIdAndDelete(subSectionId);
    if (!deletedSubSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // Remove reference from section's subSection array
    await Section.findByIdAndUpdate(
      sectionId,
      {
        $pull: {
          subSection: subSectionId,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "SubSection deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete SubSection",
      error: error.message,
    });
  }
};
