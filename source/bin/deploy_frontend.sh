#!/bin/bash
SSH_KEY_FILE_PATH=~/ssh_key

function run_build() {
    npm run build
    rsync -r assets/images/ dist/assets/images/
    rm -f $(find dist/assets/images/ -iname "*.pbm")
}

function run_generate_ssh_key_file() {
    echo "$SSH_PRIVATE_KEY" | sed -e "s/\\\n/\n/g" > "$SSH_KEY_FILE_PATH"
    chmod 600 "$SSH_KEY_FILE_PATH"
}

function run_generate_folder() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "mkdir -p $SSH_REMOTE_TEMP_DIR"
}

function run_copy_files() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "cp -R  $SSH_REMOTE_DIR/$TARGET $SSH_REMOTE_TEMP_DIR/"
}

function run_upload() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    rsync -avz -e "$SSH_COMMAND" "$SOURCE" "$SSH_USER"@"$SSH_HOST":"$SSH_REMOTE_TEMP_DIR"
}

function run_release() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"
    OLD_SSH_REMOTE_DIR="$SSH_REMOTE_DIR""_old_$(date +%s)"

    COMMANDS="rm -rf $OLD_SSH_REMOTE_DIR && mv $SSH_REMOTE_DIR $OLD_SSH_REMOTE_DIR && mv $SSH_REMOTE_TEMP_DIR $SSH_REMOTE_DIR && rm -rf $OLD_SSH_REMOTE_DIR"
    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "$COMMANDS"
}

ACTION="$1"

case "$ACTION" in
  "build")
    run_build
    ;;
  "generate_key_file")
    run_generate_ssh_key_file
    ;;
  "generate_folder")
    run_generate_folder
    ;;
  "copy_files")
    run_copy_files
    ;;
  "upload")
    run_upload
    ;;
  "release")
    run_release
    ;;
esac
