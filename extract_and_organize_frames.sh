#!/bin/bash

# Set paths real
# VIDEO_DIR="/mnt/e/videos"            # Folder containing videos
VIDEO_DIR="/mnt/c/Users/Thomas Jensen/AppData/Local/CapCut/Videos"            # Folder containing videos
OUTPUT_DIR="/mnt/e/sequences"        # Final dataset folder
TMP_DIR="/mnt/e/tmp_frames"          # Temporary storage for extracted frames
TRAIN_LIST="$OUTPUT_DIR/tri_trainlist.txt"
TEST_LIST="$OUTPUT_DIR/tri_testlist.txt"

# # Set paths test
# VIDEO_DIR="test_video"            # Folder containing videos
# OUTPUT_DIR="sequences"        # Final dataset folder
# TMP_DIR="tmp_frames"          # Temporary storage for extracted frames
# TRAIN_LIST="$OUTPUT_DIR/tri_trainlist.txt"
# TEST_LIST="$OUTPUT_DIR/tri_testlist.txt"

# Create necessary directories
mkdir -p "$OUTPUT_DIR" "$TMP_DIR"

# Extract frames from videos
echo "Extracting frames from videos..."
for video in "$VIDEO_DIR"/*.mp4; do
    base_name=$(basename "$video" .mp4)
    mkdir -p "$TMP_DIR/$base_name"
    
    # ffmpeg -i "$video" -vf "fps=24,scale=448:256" "$TMP_DIR/$base_name/frame_%04d.png"
    ffmpeg -i "$video" -vf "fps=24,scale=448:256,mpdecimate,setpts=N/FRAME_RATE/TB" "$TMP_DIR/$base_name/frame_%04d.png"
done

# Organize frames into sequences
echo "Organizing frames into Vimeo-90K format..."
sequence_id=1
for folder in "$TMP_DIR"/*; do
    [ -d "$folder" ] || continue # Skip if not a directory
    frame_list=($(ls "$folder" | sort))
    
    num_frames=${#frame_list[@]}
    for ((i=0; i<num_frames-2; i++)); do
        sub_seq_id=$((i+1))
        seq_path=$(printf "%s/%05d/%04d" "$OUTPUT_DIR" "$sequence_id" "$sub_seq_id")
        mkdir -p "$seq_path"
        
        # Copy frames into the sequence folder
        cp "$folder/${frame_list[i]}"   "$seq_path/im1.png"
        cp "$folder/${frame_list[i+1]}" "$seq_path/im2.png"
        cp "$folder/${frame_list[i+2]}" "$seq_path/im3.png"
        
        # Add sequence to training or testing list (90% train, 10% test)
        if (( RANDOM % 10 < 9 )); then
            echo "$(printf "%05d/%04d" "$sequence_id" "$sub_seq_id")" >> "$TRAIN_LIST"
        else
            echo "$(printf "%05d/%04d" "$sequence_id" "$sub_seq_id")" >> "$TEST_LIST"
        fi
    done
    ((sequence_id++))
done

# Cleanup temp frames
rm -rf "$TMP_DIR"

echo "Dataset is ready at $OUTPUT_DIR!"
