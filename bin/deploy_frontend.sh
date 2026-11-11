#!/bin/bash
SSH_KEY_FILE_PATH=~/ssh_key

# PHP run on the server by `check_locals`. It receives the path of the release's locals.php
# as its first argument and exits 1 unless that file defines a non-empty string
# $proxySecret. It only ever prints a pass/fail line: the value, the file path, the file's
# own output and any PHP error are never printed (CI logs are public).
#
# The code is sent inside single quotes through ssh and the remote shell, so it must not
# contain any single quote.
CHECK_LOCALS_PHP='
ini_set("display_errors", "0");
function proxySecretIsSet($localsFile) {
    if (!is_string($localsFile) || !is_file($localsFile)) {
        return false;
    }
    ob_start(function () {
        return "";
    });
    try {
        include $localsFile;
    } catch (Throwable $error) {
        return false;
    } finally {
        ob_end_clean();
    }
    return isset($proxySecret) && is_string($proxySecret) && $proxySecret !== "";
}
if (proxySecretIsSet($argv[1] ?? null)) {
    echo "locals.php: \$proxySecret is set\n";
    exit(0);
}
file_put_contents("php://stderr", "locals.php: \$proxySecret is missing or empty\n");
exit(1);
'

function workspace_temp_dir() {
    echo "${SSH_REMOTE_TEMP_DIR%/}-$CIRCLE_WORKFLOW_WORKSPACE_ID"
}

function remote_temp_dir() {
    if [ -n "$DEPLOY_PATH" ]; then
        echo "$(workspace_temp_dir)/$DEPLOY_PATH"
    else
        echo "$(workspace_temp_dir)"
    fi
}

function run_build() {
    npm run build
    rsync -r assets/images/ dist/assets/images/
    rm -f $(find dist/assets/images/ -iname "*.pbm")
}

function run_generate_ssh_key_file() {
    printf '%s\n' "${SSH_PRIVATE_KEY//\\n/$'\n'}" > "$SSH_KEY_FILE_PATH"
    chmod 600 "$SSH_KEY_FILE_PATH"
}

function run_generate_folder() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "mkdir -p $(remote_temp_dir)"
}

function run_copy_files() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "cp -R  $SSH_REMOTE_DIR/$TARGET $(remote_temp_dir)/"
}

function check_locals_command() {
    echo "php -r '$CHECK_LOCALS_PHP' -- $(remote_temp_dir)/locals.php"
}

function run_check_locals() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "$(check_locals_command)"
}

function run_upload() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    rsync -avz -e "$SSH_COMMAND" "$SOURCE" "$SSH_USER"@"$SSH_HOST":"$(remote_temp_dir)"
}

function run_link() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"

    $SSH_COMMAND "$SSH_USER"@"$SSH_HOST" "ln -sfn $SOURCE $(remote_temp_dir)"
}

function run_release() {
    SSH_COMMAND="ssh -i $SSH_KEY_FILE_PATH -p $SSH_PORT -o StrictHostKeyChecking=no"
    OLD_SSH_REMOTE_DIR="$SSH_REMOTE_DIR""_old_$(date +%s)"

    COMMANDS="rm -rf $OLD_SSH_REMOTE_DIR && mv $SSH_REMOTE_DIR $OLD_SSH_REMOTE_DIR && mv $(workspace_temp_dir) $SSH_REMOTE_DIR && rm -rf $OLD_SSH_REMOTE_DIR"
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
  "check_locals")
    run_check_locals
    ;;
  "upload")
    run_upload
    ;;
  "link")
    run_link
    ;;
  "release")
    run_release
    ;;
esac
