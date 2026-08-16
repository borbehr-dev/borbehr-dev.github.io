package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

// Project — одна запись портфолио, задаётся вручную в projects.yml
type Project struct {
	Title string `yaml:"title"`
	Desc  string `yaml:"desc"`
	Link  string `yaml:"link"`
	Repo  string `yaml:"repo"` // например "borbehr-dev/TodoList", используется для бейджа со звёздами (опционально)
}

// Config — корень projects.yml
type Config struct {
	GithubUser string    `yaml:"github_user"` // чей профиль фетчить в браузере, если Projects пуст
	Projects   []Project `yaml:"projects"`
}

// PageData — то, что уходит в шаблон
type PageData struct {
	Title       string
	GithubUser  string
	HasManual   bool // true = проекты заданы руками, JS-фетч не нужен
	Projects    []Project
}

const projectsFile = "projects.yml"

func loadConfig() Config {
	cfg := Config{GithubUser: "borbehr-dev"} // дефолт, если файла нет вообще

	data, err := os.ReadFile(projectsFile)
	if err != nil {
		// файла нет — работаем в режиме "фетч с гитхаба на клиенте"
		fmt.Println("projects.yml не найден — сайт будет тянуть репозитории живьём в браузере")
		return cfg
	}

	if err := yaml.Unmarshal(data, &cfg); err != nil {
		fmt.Println("projects.yml повреждён, игнорирую:", err)
		return Config{GithubUser: cfg.GithubUser}
	}

	if cfg.GithubUser == "" {
		cfg.GithubUser = "borbehr-dev"
	}
	return cfg
}

func main() {
	os.RemoveAll("dist")
	os.MkdirAll("dist", 0755)

	cfg := loadConfig()

	data := PageData{
		Title:      "borBeHR — portfolio",
		GithubUser: cfg.GithubUser,
		HasManual:  len(cfg.Projects) > 0,
		Projects:   cfg.Projects,
	}

	tmpl := template.Must(template.ParseFiles(
		"templates/layout.html",
		"templates/index.html",
	))

	f, err := os.Create("dist/index.html")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	if err := tmpl.ExecuteTemplate(f, "layout", data); err != nil {
		panic(err)
	}

	copyStatic("static", "dist")
	generateTracklist("static/audio", "dist/audio/tracks.json")

	fmt.Println("Готово. Статика лежит в dist/")
}

// Track — одна запись в audio/tracks.json
type Track struct {
	Title string `json:"title"`
	Src   string `json:"src"`
}

// titleFromFilename превращает "01 - my_song.mp3" в "my song"
func titleFromFilename(name string) string {
	base := strings.TrimSuffix(name, filepath.Ext(name))
	base = strings.ReplaceAll(base, "_", " ")
	base = strings.ReplaceAll(base, "-", " ")
	return strings.TrimSpace(base)
}

var audioExts = map[string]bool{
	".mp3": true, ".ogg": true, ".wav": true, ".m4a": true, ".flac": true,
}

// generateTracklist сканирует папку с аудио и пишет JSON-список треков,
// который потом читает player.js в браузере — руками ничего прописывать не нужно.
func generateTracklist(audioDir, outPath string) {
	var tracks []Track

	entries, err := os.ReadDir(audioDir)
	if err != nil {
		// папки нет — просто пустой список, плеер покажет "нет треков"
		writeTracklist(outPath, tracks)
		return
	}

	names := make([]string, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if audioExts[ext] {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)

	for _, n := range names {
		tracks = append(tracks, Track{
			Title: titleFromFilename(n),
			Src:   "audio/" + n,
		})
	}

	writeTracklist(outPath, tracks)
	fmt.Printf("Найдено треков: %d\n", len(tracks))
}

func writeTracklist(outPath string, tracks []Track) {
	os.MkdirAll(filepath.Dir(outPath), 0755)
	data, _ := json.MarshalIndent(tracks, "", "  ")
	os.WriteFile(outPath, data, 0644)
}

func copyStatic(src, dst string) {
	filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		rel, _ := filepath.Rel(src, path)
		target := filepath.Join(dst, rel)
		os.MkdirAll(filepath.Dir(target), 0755)
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, content, 0644)
	})
}
