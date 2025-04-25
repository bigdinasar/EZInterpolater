# In this file:
# Checks for a folder named output, creates one if none exists
import os

# General:
# Open Source Computer Vision, image processing.
# In This file:
# imread used to "read" in images, takes variable number params: 
# 3 for .exr images (image, IMREAD_COLOR, IMREAD_ANYDEPTH), 2 for other file types
# Checks if images are .exr format. EXR is a high-dynamic range, multi-channel raster file format.
import cv2

# pytorch for tensors and their operations
import torch
import argparse

# the module for the basic graph functions in pytorch
from torch.nn import functional as F
import warnings
warnings.filterwarnings("ignore")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.set_grad_enabled(False)
if torch.cuda.is_available():
    torch.backends.cudnn.enabled = True
    torch.backends.cudnn.benchmark = True

parser = argparse.ArgumentParser(description='Interpolation for a pair of images')
parser.add_argument('--img', dest='img', nargs=2, required=True)
parser.add_argument('--exp', default=4, type=int)
parser.add_argument('--ratio', default=0, type=float, help='inference ratio between two images with 0 - 1 range')
parser.add_argument('--rthreshold', default=0.02, type=float, help='returns image when actual ratio falls in given range threshold')
parser.add_argument('--rmaxcycles', default=8, type=int, help='limit max number of bisectional cycles')
parser.add_argument('--model', dest='modelDir', type=str, default='train_log', help='directory with trained model files')

args = parser.parse_args()

try:
    from model.RIFE_HD import Model
    model = Model()
    model.load_model(args.modelDir, -1)
    print("Loaded v1.x HD model")
except:
    from model.RIFE import Model
    model = Model()
    model.load_model(args.modelDir, -1)
    print("Loaded ArXiv-RIFE model")
model.eval()
model.device()

if args.img[0].endswith('.exr') and args.img[1].endswith('.exr'):
    img0 = cv2.imread(args.img[0], cv2.IMREAD_COLOR | cv2.IMREAD_ANYDEPTH)
    img1 = cv2.imread(args.img[1], cv2.IMREAD_COLOR | cv2.IMREAD_ANYDEPTH)
    img0 = (torch.tensor(img0.transpose(2, 0, 1)).to(device)).unsqueeze(0)
    img1 = (torch.tensor(img1.transpose(2, 0, 1)).to(device)).unsqueeze(0)

# IMREAD_UNCHANGED tells OpenCV to load the image as it is, including the alpha channel if present
else:
    # reads in images
    img0 = cv2.imread(args.img[0], cv2.IMREAD_UNCHANGED)
    img1 = cv2.imread(args.img[1], cv2.IMREAD_UNCHANGED)
    # transposes images to tensors
    img0 = (torch.tensor(img0.transpose(2, 0, 1)).to(device) / 255.).unsqueeze(0)
    img1 = (torch.tensor(img1.transpose(2, 0, 1)).to(device) / 255.).unsqueeze(0)

# The shape of an image is accessed by img.shape. 
# It returns a tuple of the number of rows, columns, and channels (if the image is color)
# by this time the images are tensors, so I believe this is meant to normalize
# shape of the corresponding tensor by "padding" (adding a constant like 0 to fill in missing dimensions)
n, c, h, w = img0.shape
ph = ((h - 1) // 32 + 1) * 32
pw = ((w - 1) // 32 + 1) * 32
padding = (0, pw - w, 0, ph - h)
img0 = F.pad(img0, padding)
img1 = F.pad(img1, padding)

# I believe this is for .exr files, as they can have irregular pixel values, like ratios, NaNs, etc.
# Unable to run use .exr files, but this code never runs for PNGs.
if args.ratio:
    img_list = [img0]
    img0_ratio = 0.0
    img1_ratio = 1.0
    if args.ratio <= img0_ratio + args.rthreshold / 2:
        middle = img0
    elif args.ratio >= img1_ratio - args.rthreshold / 2:
        middle = img1
    else:
        tmp_img0 = img0
        tmp_img1 = img1
        for inference_cycle in range(args.rmaxcycles):
            middle = model.inference(tmp_img0, tmp_img1)
            middle_ratio = ( img0_ratio + img1_ratio ) / 2
            if args.ratio - (args.rthreshold / 2) <= middle_ratio <= args.ratio + (args.rthreshold / 2):
                break
            if args.ratio > middle_ratio:
                tmp_img0 = middle
                img0_ratio = middle_ratio
            else:
                tmp_img1 = middle
                img1_ratio = middle_ratio
    img_list.append(middle)
    img_list.append(img1)
else:
    # print("there's not a ratio")
    img_list = [img0, img1]

    # i is the exponent arg (default is 4, therefore range will be 0 - 3)
    # every iteration there are twice as many 'mid's as before ie
    # the first iteration there are 2 images, therefore 1 'mid' to be inferred/interpolated
    # the second iteration there are 3 images, therefore 2 'mid's to be inferred/interpolated
    # on the last iteration (assuming you start with 2 images), there will be 9 images
    # (2+1) -> (3+2) -> (5+4), 9 images and 8 'mid's, therefore the final output will be
    # 17 images 
    for i in range(args.exp):
        # print("i: ", i)
        tmp = []
        for j in range(len(img_list) - 1):
            # print("i: ", i, " j: ", j)
            mid = model.inference(img_list[j], img_list[j + 1])
            tmp.append(img_list[j])
            tmp.append(mid)
        tmp.append(img1)
        img_list = tmp

if not os.path.exists('output'):
    os.mkdir('output')

# Writes out the image using imwrite, in .exr or .png respectively.    
for i in range(len(img_list)):
    if args.img[0].endswith('.exr') and args.img[1].endswith('.exr'):
        cv2.imwrite('output/img{}.exr'.format(i), (img_list[i][0]).cpu().numpy().transpose(1, 2, 0)[:h, :w], [cv2.IMWRITE_EXR_TYPE, cv2.IMWRITE_EXR_TYPE_HALF])
    else:
        cv2.imwrite('output/img{}.png'.format(i), (img_list[i][0] * 255).byte().cpu().numpy().transpose(1, 2, 0)[:h, :w])
