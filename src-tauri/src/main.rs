// Evita la finestra della console su Windows nelle build di rilascio. NON RIMUOVERE.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    nekocalendar_lib::run()
}
