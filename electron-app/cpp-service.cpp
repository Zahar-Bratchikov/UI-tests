#include <iostream>
#include <string>
#include <ctime>
#include <thread>
#include <sstream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <vector>
#include <map>
#include <mutex>
#include <fstream>
#include "json.hpp"

using json = nlohmann::json;

const int PORT = 8081;

struct Task {
    int id;
    std::string title;
    std::string description;
    std::string status;
};

std::vector<Task> tasks;
std::mutex tasks_mutex;
int next_id = 1;
const std::string DB_FILE = "tasks_db.json";

void load_db() {
    std::ifstream f(DB_FILE);
    if (!f) return;
    json j;
    f >> j;
    tasks.clear();
    for (const auto& item : j) {
        tasks.push_back(Task{
            item["id"],
            item["title"],
            item["description"],
            item["status"]
        });
        if (item["id"].get<int>() >= next_id) next_id = item["id"].get<int>() + 1;
    }
}

void save_db() {
    json j = json::array();
    for (const auto& t : tasks) {
        j.push_back({
            {"id", t.id},
            {"title", t.title},
            {"description", t.description},
            {"status", t.status}
        });
    }
    std::ofstream f(DB_FILE);
    f << j.dump(2);
}

std::string handle_request(const std::string& req) {
    std::lock_guard<std::mutex> lock(tasks_mutex);
    // ...parse HTTP method and path...
    std::istringstream iss(req);
    std::string method, path, version;
    iss >> method >> path >> version;
    std::string body = req.substr(req.find("\r\n\r\n") + 4);
    if (method == "GET" && path == "/tasks") {
        json j = json::array();
        for (const auto& t : tasks) {
            j.push_back({{"id", t.id}, {"title", t.title}, {"description", t.description}, {"status", t.status}});
        }
        return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + j.dump();
    } else if (method == "GET" && path.find("/tasks/") == 0) {
        int id = std::stoi(path.substr(7));
        for (const auto& t : tasks) if (t.id == id) {
            json j = {{"id", t.id}, {"title", t.title}, {"description", t.description}, {"status", t.status}};
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n" + j.dump();
        }
        return "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\":\"not found\"}";
    } else if (method == "POST" && path == "/tasks") {
        auto j = json::parse(body, nullptr, false);
        if (!j.is_object()) return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"error\":\"bad json\"}";
        // Исправление: поддержка Content-Type: application/json с возможным префиксом
        if (j.contains("title") && j.contains("description") && j.contains("status")) {
            Task t{next_id++, j["title"].get<std::string>(), j["description"].get<std::string>(), j["status"].get<std::string>()};
            tasks.push_back(t);
            save_db();
            return "HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n\r\n" + json({{"id", t.id}}).dump();
        } else {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"error\":\"missing fields\"}";
        }
    } else if (method == "PUT" && path.find("/tasks/") == 0) {
        int id = std::stoi(path.substr(7));
        auto j = json::parse(body, nullptr, false);
        if (!j.is_object()) return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"error\":\"bad json\"}";
        for (auto& t : tasks) if (t.id == id) {
            t.title = j["title"];
            t.description = j["description"];
            t.status = j["status"];
            save_db();
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"result\":\"updated\"}";
        }
        return "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\":\"not found\"}";
    } else if (method == "DELETE" && path.find("/tasks/") == 0) {
        std::string idstr = path.substr(7);
        if (idstr.empty() || idstr.find_first_not_of("0123456789") != std::string::npos) {
            return "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\n\r\n{\"error\":\"bad id\"}";
        }
        int id = std::stoi(idstr);
        for (auto it = tasks.begin(); it != tasks.end(); ++it) if (it->id == id) {
            tasks.erase(it);
            save_db();
            return "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"result\":\"deleted\"}";
        }
        return "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\":\"not found\"}";
    }
    return "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\":\"unknown command\"}";
}

int main() {
    load_db();
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR | SO_REUSEPORT, &opt, sizeof(opt));
    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(PORT);
    bind(server_fd, (struct sockaddr*)&address, sizeof(address));
    listen(server_fd, 3);
    std::cout << "READY" << std::endl;
    while (true) {
        int addrlen = sizeof(address);
        int new_socket = accept(server_fd, (struct sockaddr*)&address, (socklen_t*)&addrlen);
        if (new_socket < 0) continue;
        std::thread([new_socket]() {
            char buffer[2048] = {0};
            std::string req;
            int n = read(new_socket, buffer, 2047);
            if (n <= 0) { close(new_socket); return; }
            req.append(buffer, n);
            // Если есть Content-Length, дочитываем тело
            size_t cl_pos = req.find("Content-Length:");
            int content_length = 0;
            if (cl_pos != std::string::npos) {
                size_t cl_end = req.find("\r\n", cl_pos);
                std::string cl = req.substr(cl_pos + 15, cl_end - cl_pos - 15);
                content_length = std::stoi(cl);
            }
            size_t body_pos = req.find("\r\n\r\n");
            if (body_pos != std::string::npos) {
                int have = req.size() - (body_pos + 4);
                while (have < content_length) {
                    n = read(new_socket, buffer, std::min(2047, content_length - have));
                    if (n <= 0) break;
                    req.append(buffer, n);
                    have += n;
                }
            }
            std::string resp = handle_request(req);
            send(new_socket, resp.c_str(), resp.size(), 0);
            close(new_socket);
        }).detach();
    }
    close(server_fd);
    return 0;
}
