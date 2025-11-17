# Custom alias: install + auto update requirements.txt
alias pipi='f(){ pip install "$@" && pip freeze > requirements.txt; }; f'
# Auto-update requirements.txt after pip install
pip() {
    if [ "$1" = "install" ]; then
        command pip install "${@:2}"   # run the real pip install
        pip freeze | sort > requirements.txt  # update requirements.txt
    else
        command pip "$@"  # run other pip commands normally
    fi
}

# Custom alias: install + auto update requirements.txt 