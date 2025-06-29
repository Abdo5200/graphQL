import React, { Component } from "react";

import Image from "../../../components/Image/Image";
import "./SinglePost.css";

class SinglePost extends Component {
  state = {
    title: "",
    author: "",
    date: "",
    image: "",
    content: "",
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const graphqlQuery = {
      query: `query gettingPost($postId:ID!){
          getPost(postId:$postId)
          {
            title 
            content 
            creator{
              name
            }
            createdAt 
            imageUrl
          }
      }`,
      variables: {
        postId: postId,
      },
    };
    fetch(`http://localhost:8080/graphql`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + this.props.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.errors && resData.errors[0].code === 401) {
          throw new Error("Not Authenticated");
        } else if (resData.errors && resData.errors[0].code === 404) {
          throw new Error("Post not found");
        }
        this.setState({
          title: resData.data.getPost.title,
          author: resData.data.getPost.creator.name,
          date: new Date(resData.data.getPost.createdAt).toLocaleDateString(
            "en-US"
          ),
          content: resData.data.getPost.content,
          image: `http://localhost:8080/${resData.data.getPost.imageUrl}`,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
